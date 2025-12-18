import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import type { PageProps } from '@inertiajs/shared';
import { Clock, Truck } from 'lucide-react';
import { FormEvent } from 'react';

interface OrdersPageProps extends PageProps {
    orders: {
        data: OrderResource[];
        links: { url: string | null; label: string; active: boolean }[];
    };
    bouquets: BouquetResource[];
}

interface OrderResource {
    id: number;
    customer?: { name: string | null } | null;
    total: string;
    payment_status: string;
    status: string;
    delivery_type: string;
    created_at: string;
    delivery_time?: string | null;
}

interface BouquetResource {
    id: number;
    name: string;
    bouquet_recipe?: {
        items: { id: number; qty: string; product?: { name: string } | null }[];
    } | null;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Заказы',
        href: '/orders',
    },
];

const statusLabels: Record<string, string> = {
    new: 'Новый',
    in_progress: 'В работе',
    ready: 'Готов',
    delivered: 'Доставлен',
    completed: 'Завершён',
    cancelled: 'Отменён',
};

const statusSteps: Record<string, string[]> = {
    new: ['in_progress', 'cancelled'],
    in_progress: ['ready', 'cancelled'],
    ready: ['delivered', 'completed'],
    delivered: ['completed'],
    completed: [],
    cancelled: [],
};

const deliveryLabels: Record<string, string> = {
    pickup: 'Самовывоз',
    courier: 'Доставка',
    shipping: 'Отправка',
};

function formatCurrency(value: string) {
    return new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        minimumFractionDigits: 0,
    }).format(Number(value));
}

export default function OrdersIndex({ orders, auth }: OrdersPageProps) {
    const orderForm = useForm({
        customer_name: '',
        customer_phone: '',
        delivery_type: 'pickup',
        total: '',
        notes: '',
    });

    const submitOrder = (event: FormEvent) => {
        event.preventDefault();
        orderForm.post('/orders', {
            onSuccess: () => orderForm.reset(),
        });
    };

    const moveStatus = (orderId: number, status: string) => {
        router.post(
            `/orders/${orderId}/status`,
            { status },
            {
                preserveScroll: true,
                preserveState: true,
            }
        );
    };

    return (
        <AppLayout user={auth.user} breadcrumbs={breadcrumbs}>
            <Head title="Заказы" />

            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-semibold">Заказы</h1>
                    <p className="text-sm text-muted-foreground">
                        Последние заказы и их статус оплаты
                    </p>
                </div>

                <Card className="border-border/80">
                    <CardHeader>
                        <CardTitle>Быстрый заказ</CardTitle>
                        <CardDescription>Создайте карточку клиента и сумму без лишних шагов</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form className="grid gap-4 md:grid-cols-2" onSubmit={submitOrder}>
                            <div className="space-y-2">
                                <Label htmlFor="customer_name">Имя клиента</Label>
                                <Input
                                    id="customer_name"
                                    value={orderForm.data.customer_name}
                                    onChange={(event) => orderForm.setData('customer_name', event.target.value)}
                                    placeholder="Без имени"
                                />
                                {orderForm.errors.customer_name && (
                                    <p className="text-xs text-destructive">{orderForm.errors.customer_name}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="customer_phone">Телефон</Label>
                                <Input
                                    id="customer_phone"
                                    value={orderForm.data.customer_phone}
                                    onChange={(event) => orderForm.setData('customer_phone', event.target.value)}
                                    placeholder="+7 (999) 000-00-00"
                                />
                                {orderForm.errors.customer_phone && (
                                    <p className="text-xs text-destructive">{orderForm.errors.customer_phone}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="delivery_type">Тип доставки</Label>
                                <select
                                    id="delivery_type"
                                    className="w-full rounded-md border px-3 py-2 text-sm"
                                    value={orderForm.data.delivery_type}
                                    onChange={(event) => orderForm.setData('delivery_type', event.target.value)}
                                >
                                    <option value="pickup">Самовывоз</option>
                                    <option value="courier">Доставка</option>
                                    <option value="shipping">Отправка</option>
                                </select>
                                {orderForm.errors.delivery_type && (
                                    <p className="text-xs text-destructive">{orderForm.errors.delivery_type}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="total">Сумма</Label>
                                <Input
                                    id="total"
                                    type="number"
                                    min={0}
                                    step="0.01"
                                    value={orderForm.data.total}
                                    onChange={(event) => orderForm.setData('total', event.target.value)}
                                    required
                                />
                                {orderForm.errors.total && (
                                    <p className="text-xs text-destructive">{orderForm.errors.total}</p>
                                )}
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="notes">Комментарий</Label>
                                <textarea
                                    id="notes"
                                    className="min-h-[80px] w-full rounded-md border px-3 py-2 text-sm"
                                    value={orderForm.data.notes}
                                    onChange={(event) => orderForm.setData('notes', event.target.value)}
                                    placeholder="Описание состава, пожелания, детали доставки"
                                />
                                {orderForm.errors.notes && (
                                    <p className="text-xs text-destructive">{orderForm.errors.notes}</p>
                                )}
                            </div>
                            <div className="md:col-span-2">
                                <button
                                    type="submit"
                                    className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
                                    disabled={orderForm.processing}
                                >
                                    Добавить заказ
                                </button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Очередь заказов</CardTitle>
                        <CardDescription>
                            Обновляется в реальном времени после действий сотрудников
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>ID</TableHead>
                                    <TableHead>Клиент</TableHead>
                                    <TableHead>Доставка</TableHead>
                                    <TableHead>Создан</TableHead>
                                    <TableHead>Сумма</TableHead>
                                    <TableHead>Оплата</TableHead>
                                    <TableHead>Статус</TableHead>
                                    <TableHead>Действия</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {orders.data.map((order) => (
                                    <TableRow key={order.id}>
                                        <TableCell className="font-medium">#{order.id}</TableCell>
                                        <TableCell>{order.customer?.name ?? 'Без имени'}</TableCell>
                                        <TableCell className="flex items-center gap-2">
                                            <Truck className="h-4 w-4 text-muted-foreground" />
                                            {deliveryLabels[order.delivery_type] ?? order.delivery_type}
                                        </TableCell>
                                        <TableCell className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Clock className="h-4 w-4" />
                                            {new Date(order.created_at).toLocaleString('ru-RU')}
                                        </TableCell>
                                        <TableCell>{formatCurrency(order.total)}</TableCell>
                                        <TableCell>
                                            <Badge variant={order.payment_status === 'paid' ? 'default' : 'secondary'}>
                                                {order.payment_status === 'paid' ? 'Оплачено' : 'Ожидает'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">
                                                {statusLabels[order.status] ?? order.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="space-x-2">
                                            {statusSteps[order.status]?.map((status) => (
                                                <button
                                                    key={`${order.id}-${status}`}
                                                    onClick={() => moveStatus(order.id, status)}
                                                    className="rounded-md border px-2 py-1 text-xs hover:bg-muted"
                                                >
                                                    {statusLabels[status] ?? status}
                                                </button>
                                            ))}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>

                        <div className="mt-4 flex flex-wrap gap-2 text-sm">
                            {orders.links
                                .filter((link) => link.url)
                                .map((link, index) => (
                                    <Link
                                        key={`${link.label}-${index}`}
                                        href={link.url as string}
                                        className={`rounded-md border px-3 py-1 ${link.active ? 'bg-primary text-primary-foreground' : ''}`}
                                    >
                                        {link.label.replace('&laquo; Previous', '‹').replace('Next &raquo;', '›')}
                                    </Link>
                                ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
