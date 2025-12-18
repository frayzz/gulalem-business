<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Payment;
use App\Models\PaymentStatusHistory;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class PaymentService
{
    public const STATUS_UNPAID = 'unpaid';
    public const STATUS_PARTIALLY_PAID = 'partially_paid';
    public const STATUS_PAID = 'paid';
    public const STATUS_REFUNDED = 'refunded';
    public const STATUS_CANCELED = 'canceled';

    public function registerPayment(array $data): Payment
    {
        return DB::transaction(function () use ($data) {
            /** @var Payment $payment */
            $payment = Payment::create($data);

            if ($payment->order) {
                $this->refreshStatus($payment->order);
            }

            return $payment;
        });
    }

    public function refreshStatus(Order $order): void
    {
        $order->loadMissing('payments');
        $paidAmount = (float) $order->payments()->sum('amount');
        $order->paid_total = $paidAmount;

        $status = $this->resolveStatus($paidAmount, (float) $order->total);

        $this->updateStatus($order, $status);
    }

    public function resolveStatus(float $paidAmount, float $total): string
    {
        if ($paidAmount <= 0) {
            return self::STATUS_UNPAID;
        }

        if ($paidAmount < $total) {
            return self::STATUS_PARTIALLY_PAID;
        }

        return self::STATUS_PAID;
    }

    protected function updateStatus(Order $order, string $newStatus): void
    {
        $oldStatus = $order->payment_status;

        if ($oldStatus === $newStatus) {
            $order->save();
            return;
        }

        $order->payment_status = $newStatus;
        $order->save();

        PaymentStatusHistory::create([
            'order_id' => $order->id,
            'old_status' => $oldStatus,
            'new_status' => $newStatus,
            'user_id' => Auth::id(),
        ]);
    }
}
