<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Services\PhoneNormalizer;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PhoneNormalizerTest extends TestCase
{
    use RefreshDatabase;

    public function test_normalizes_kz_numbers(): void
    {
        $service = new PhoneNormalizer();

        $this->assertSame('+77789797777', $service->normalize('87789797777'));
        $this->assertSame('+77789797777', $service->normalize('+7 (778) 979-77-77'));
    }

    public function test_deduplicates_by_unique_constraint(): void
    {
        Customer::create(['name' => 'A', 'phone' => '87789797777']);

        $this->expectException(\Illuminate\Database\QueryException::class);

        Customer::create(['name' => 'B', 'phone' => '+7 778 979 77 77']);
    }
}
