<?php

namespace App\Services;

class PhoneNormalizer
{
    public function normalize(?string $phone): ?string
    {
        if (!$phone) {
            return null;
        }

        $digits = preg_replace('/\D+/', '', $phone);

        if (!$digits) {
            return null;
        }

        if (strlen($digits) === 11 && str_starts_with($digits, '8')) {
            $digits = '7'.substr($digits, 1);
        }

        if (strlen($digits) === 10) {
            $digits = '7'.$digits;
        }

        if (!str_starts_with($digits, '7')) {
            return null;
        }

        return '+'.$digits;
    }
}
