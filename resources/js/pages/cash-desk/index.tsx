import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import type { PageProps } from '@inertiajs/shared';
import { Banknote, CreditCard, Receipt } from 'lucide-react';
import { FormEvent } from 'react';

type PaymentMethod = 'cash' | 'card' | 'transfer' | 'mixed';

interface CashDeskProps extends PageProps {
    payments: PaymentResource[];
    methodTotals: Record<string, number>;
    paymentsToday: number;
    openOrders: OrderBalance[];
}

interface PaymentResource {
    id: number;
    method: PaymentMethod | string;
    amount: number;
    order_id?: number | null;
    created_at: string;
}

interface OrderBalance {
    id: number;
    total: number;
    paid_total: number;
    payment_status: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Касса', href: '/cash-desk' },
];

export default function CashDeskIndex({ auth, payments, methodTotals, paymentsToday, openOrders }: CashDeskProps) {
    const paymentForm = useForm({
        method: 'cash' as PaymentMethod,
        amount: '',
        order_id: '',
    });

    const registerPayment = (event: FormEvent) => {
        event.preventDefault();
        paymentForm.post('/cash-desk/payments', {
            onSuccess: () => paymentForm.reset('amount', 'order_id'),
        });
    };

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', minimumFractionDigits: 0 }).format(value);

    return (
        <AppLayout user={auth.user} breadcrumbs={breadcrumbs}>
            <Head title="Касса" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">Касса</h1>
                        <p className="text-sm text-muted-foreground">Пробейте оплату и закройте баланс по заказам</p>
                    </div>
                    <Badge variant="secondary">За день: {formatCurrency(paymentsToday)}</Badge>
                </div>

                <section className="grid gap-4 lg:grid-cols-2">
                    <Card className="border-border/80">
                        <CardHeader>
                            <CardTitle>Принять оплату</CardTitle>
                            <CardDescription>Поддерживаются наличные, карта и переводы</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form className="space-y-4" onSubmit={registerPayment}>
                                <div className="grid gap-3 md:grid-cols-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="method">Метод</Label>
                                        <select
                                            id="method"
                                            className="w-full rounded-md border px-3 py-2 text-sm"
                                            value={paymentForm.data.method}
                                            onChange={(event) =>
                                                paymentForm.setData('method', event.target.value as PaymentMethod)
                                            }
                                        >
                                            <option value="cash">Наличные</option>
                                            <option value="card">Карта</option>
                                            <option value="transfer">Перевод</option>
                                            <option value="mixed">Смешанная</option>
                                        </select>
                                        {paymentForm.errors.method && (
                                            <p className="text-xs text-destructive">{paymentForm.errors.method}</p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="amount">Сумма</Label>
                                        <Input
                                            id="amount"
                                            type="number"
                                            min={0}
                                            step="0.01"
                                            value={paymentForm.data.amount}
                                            onChange={(event) => paymentForm.setData('amount', event.target.value)}
                                        />
                                        {paymentForm.errors.amount && (
                                            <p className="text-xs text-destructive">{paymentForm.errors.amount}</p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="order_id">ID заказа</Label>
                                        <Input
                                            id="order_id"
                                            type="number"
                                            min={1}
                                            value={paymentForm.data.order_id}
                                            onChange={(event) => paymentForm.setData('order_id', event.target.value)}
                                            placeholder="Номер заказа"
                                            required
                                        />
                                        {paymentForm.errors.order_id && (
                                            <p className="text-xs text-destructive">{paymentForm.errors.order_id}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <Button type="submit" disabled={paymentForm.processing}>
                                        <Receipt className="mr-2 h-4 w-4" />Провести оплату
                                    </Button>
                                    <p className="text-xs text-muted-foreground">
                                        Сумма мгновенно попадёт в отчёт и отметится в заказе по указанному номеру.
                                    </p>
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    <Card className="border-border/80">
                        <CardHeader>
                            <CardTitle>Итоги кассы</CardTitle>
                            <CardDescription>Разбивка по методам оплаты</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-3 md:grid-cols-2">
                            <div className="rounded-lg border bg-muted/30 p-3">
                                <div className="flex items-center justify-between text-sm text-muted-foreground">
                                    <span>Наличными</span>
                                    <Banknote className="h-4 w-4" />
                                </div>
                                <p className="text-xl font-semibold">
                                    {formatCurrency(Number(methodTotals.cash ?? 0))}
                                </p>
                            </div>
                            <div className="rounded-lg border bg-muted/30 p-3">
                                <div className="flex items-center justify-between text-sm text-muted-foreground">
                                    <span>Карта</span>
                                    <CreditCard className="h-4 w-4" />
                                </div>
                                <p className="text-xl font-semibold">{formatCurrency(Number(methodTotals.card ?? 0))}</p>
                            </div>
                            <div className="rounded-lg border bg-muted/30 p-3">
                                <div className="flex items-center justify-between text-sm text-muted-foreground">
                                    <span>Перевод</span>
                                    <CreditCard className="h-4 w-4" />
                                </div>
                                <p className="text-xl font-semibold">
                                    {formatCurrency(Number(methodTotals.transfer ?? 0))}
                                </p>
                            </div>
                            <div className="rounded-lg border bg-muted/30 p-3">
                                <div className="flex items-center justify-between text-sm text-muted-foreground">
                                    <span>Смешанная оплата</span>
                                    <Receipt className="h-4 w-4" />
                                </div>
                                <p className="text-xl font-semibold">{formatCurrency(Number(methodTotals.mixed ?? 0))}</p>
                            </div>
                        </CardContent>
                    </Card>
                </section>

                <section className="grid gap-4 lg:grid-cols-2" id="cash-desk">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Свежие оплаты</CardTitle>
                                <CardDescription>Последние движения по кассе</CardDescription>
                            </div>
                            <Badge variant="outline">{payments.length} записей</Badge>
                        </CardHeader>
                        <CardContent className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>ID</TableHead>
                                        <TableHead>Метод</TableHead>
                                        <TableHead>Сумма</TableHead>
                                        <TableHead>Заказ</TableHead>
                                        <TableHead>Время</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {payments.map((payment) => (
                                        <TableRow key={payment.id}>
                                            <TableCell className="font-medium">#{payment.id}</TableCell>
                                            <TableCell>{payment.method}</TableCell>
                                            <TableCell>{formatCurrency(payment.amount)}</TableCell>
                                            <TableCell>{payment.order_id ? `#${payment.order_id}` : '—'}</TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {new Date(payment.created_at).toLocaleString('ru-RU')}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Незакрытые заказы</CardTitle>
                                <CardDescription>Остаток к оплате по каждому</CardDescription>
                            </div>
                            <Badge variant="outline">{openOrders.length}</Badge>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {openOrders.length === 0 && (
                                <p className="text-sm text-muted-foreground">Все заказы закрыты по оплате.</p>
                            )}
                            {openOrders.map((order) => {
                                const owed = Number(order.total) - Number(order.paid_total);
                                const statusLabel = order.payment_status === 'paid' ? 'Оплачено' : 'Не оплачено';

                                return (
                                    <div key={order.id} className="rounded-lg border bg-muted/40 p-3">
                                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                                            <span>Заказ #{order.id}</span>
                                            <Badge variant={owed <= 0 ? 'default' : 'secondary'}>{statusLabel}</Badge>
                                        </div>
                                        <p className="text-lg font-semibold">{formatCurrency(Number(order.total))}</p>
                                        <p className="text-xs text-muted-foreground">
                                            Оплачено: {formatCurrency(Number(order.paid_total))} · Остаток: {formatCurrency(owed)}
                                        </p>
                                    </div>
                                );
                            })}
                        </CardContent>
                    </Card>
                </section>
            </div>
        </AppLayout>
    );
}
