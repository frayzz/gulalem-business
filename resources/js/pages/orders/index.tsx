import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import type { PageProps } from '@inertiajs/shared';
import { Clock, Truck } from 'lucide-react';

interface OrdersPageProps extends PageProps {
    orders: {
        data: OrderResource[];
        links: { url: string | null; label: string; active: boolean }[];
    };
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

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Заказы',
        href: '/orders',
    },
];

const statusLabels: Record<string, string> = {
    new: 'Новый',
    processing: 'В работе',
    ready: 'Готов',
    delivered: 'Доставлен',
    completed: 'Завершён',
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
