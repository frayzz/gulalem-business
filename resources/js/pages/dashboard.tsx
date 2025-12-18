import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import type { PageProps } from '@inertiajs/shared';
import { Banknote, ClipboardList, Leaf, PackageSearch, ReceiptText } from 'lucide-react';

interface DashboardProps extends PageProps {
    orders: OrderResource[];
    inventory: InventoryResource[];
    paymentsToday: number;
    ordersToday: number;
    completedToday: number;
}

interface OrderResource {
    id: number;
    customer?: string | null;
    total: number;
    status: string;
    delivery_type: string;
    payment_status: string;
    paid_total: number;
    created_at: string;
    delivery_time?: string | null;
    notes?: string | null;
}

interface InventoryResource {
    id: number;
    product?: string | null;
    qty_left: number;
    expires_at?: string | null;
    arrived_at?: string | null;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
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

function formatCurrency(value: number) {
    return new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        minimumFractionDigits: 0,
    }).format(value);
}

export default function Dashboard({ auth, orders, inventory, paymentsToday, ordersToday, completedToday }: DashboardProps) {
    const summaryCards = [
        {
            title: 'Выручка сегодня',
            value: formatCurrency(paymentsToday),
            description: `${ordersToday} заказов за день`,
            icon: Banknote,
        },
        {
            title: 'Закрыто',
            value: completedToday,
            description: 'Заказы со статусом «Завершён»',
            icon: ClipboardList,
        },
        {
            title: 'Партии на складе',
            value: inventory.length,
            description: 'Отсортированы по сроку годности',
            icon: PackageSearch,
        },
    ];

    return (
        <AppLayout user={auth.user} breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />

            <div className="space-y-6">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-semibold">Дашборд</h1>
                        <p className="text-sm text-muted-foreground">
                            Живые данные из заказов, оплат и партий на складе
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button asChild variant="outline">
                            <Link href="/orders">Открыть заказы</Link>
                        </Button>
                        <Button asChild>
                            <Link href="/inventory">Склад</Link>
                        </Button>
                    </div>
                </div>

                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" id="reports">
                    {summaryCards.map((card) => (
                        <Card key={card.title} className="border-border/80">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div className="space-y-2">
                                    <CardTitle className="text-sm text-muted-foreground">{card.title}</CardTitle>
                                    <div className="text-2xl font-semibold">{card.value}</div>
                                    <CardDescription>{card.description}</CardDescription>
                                </div>
                                <card.icon className="h-8 w-8 text-muted-foreground" />
                            </CardHeader>
                        </Card>
                    ))}
                </section>

                <section className="grid gap-4 lg:grid-cols-2" id="orders">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Последние заказы</CardTitle>
                                <CardDescription>Сводка по статусу и оплате</CardDescription>
                            </div>
                            <Button asChild variant="ghost" size="sm">
                                <Link href="/orders">Все заказы</Link>
                            </Button>
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
                                    {orders.map((order) => (
                                        <TableRow key={order.id}>
                                            <TableCell className="font-medium">#{order.id}</TableCell>
                                            <TableCell>{order.customer ?? 'Без имени'}</TableCell>
                                            <TableCell>{deliveryLabels[order.delivery_type] ?? order.delivery_type}</TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {new Date(order.created_at).toLocaleString('ru-RU')}
                                            </TableCell>
                                            <TableCell>{formatCurrency(order.total)}</TableCell>
                                            <TableCell>
                                                <Badge variant={order.payment_status === 'paid' ? 'default' : 'secondary'}>
                                                    {order.payment_status === 'paid'
                                                        ? 'Оплачено'
                                                        : `Оплачено ${formatCurrency(order.paid_total)}`}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{statusLabels[order.status] ?? order.status}</Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    <Card id="inventory">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Склад</CardTitle>
                                <CardDescription>Партии с наименьшим сроком годности сверху</CardDescription>
                            </div>
                            <Button asChild variant="ghost" size="sm">
                                <Link href="/inventory">К списку</Link>
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {inventory.length === 0 && (
                                <p className="text-sm text-muted-foreground">Нет активных партий.</p>
                            )}
                            {inventory.map((batch) => (
                                <div
                                    key={batch.id}
                                    className="flex items-center justify-between rounded-lg border bg-muted/40 px-3 py-2"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="rounded-md bg-primary/10 p-2 text-primary">
                                            <Leaf className="h-4 w-4" />
                                        </span>
                                        <div>
                                            <p className="font-medium">{batch.product ?? 'Без названия'}</p>
                                            <p className="text-xs text-muted-foreground">
                                                Поступление {batch.arrived_at ? new Date(batch.arrived_at).toLocaleDateString('ru-RU') : '—'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <Badge variant="secondary">{batch.qty_left}</Badge>
                                        <p className="text-xs text-muted-foreground">
                                            Годен до {batch.expires_at ? new Date(batch.expires_at).toLocaleDateString('ru-RU') : '—'}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </section>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Комментарии из заказов</CardTitle>
                            <CardDescription>Все замечания клиентов доступны на странице комментов</CardDescription>
                        </div>
                        <Button asChild variant="ghost" size="sm">
                            <Link href="/comments">Открыть</Link>
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {orders.filter((order) => order.notes).length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                Пока нет комментариев. Добавьте заметки в заказах, чтобы увидеть их здесь.
                            </p>
                        ) : (
                            <ul className="space-y-3">
                                {orders
                                    .filter((order) => order.notes)
                                    .slice(0, 3)
                                    .map((order) => (
                                        <li key={order.id} className="rounded-lg border bg-muted/30 p-3">
                                            <div className="flex items-center justify-between text-sm text-muted-foreground">
                                                <span>Заказ #{order.id}</span>
                                                <span>{new Date(order.created_at).toLocaleDateString('ru-RU')}</span>
                                            </div>
                                            <p className="mt-1 text-sm">{order.notes}</p>
                                        </li>
                                    ))}
                            </ul>
                        )}
                    </CardContent>
                </Card>

                <section className="grid gap-4 lg:grid-cols-2" id="cash-desk">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Как добавить товар</CardTitle>
                                <CardDescription>Шаги для создания позиции и оприходования партии</CardDescription>
                            </div>
                            <Badge variant="secondary">API</Badge>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm leading-relaxed">
                            <ol className="list-decimal space-y-2 pl-4 text-muted-foreground">
                                <li>
                                    Создайте товар через <code>POST /api/products</code> с полями <code>name</code>,
                                    <code>sku</code>, <code>type</code>, <code>unit</code>, <code>default_price</code>.
                                </li>
                                <li>
                                    Оформите приход партии на склад через <code>POST /api/inventory/intake</code> — укажите
                                    <code>product_id</code>, <code>qty</code>, себестоимость и даты поступления/годности.
                                </li>
                                <li>
                                    Обновите остаток или спишите брак командой <code>POST /api/inventory/write-off</code>
                                    (нужно лишь <code>product_id</code> и <code>qty</code>).
                                </li>
                            </ol>

                            <div className="rounded-lg bg-muted/40 p-3 font-mono text-xs text-muted-foreground">
                                {`# пример: создать товар
curl -X POST /api/products \\
  -H "Accept: application/json" \\
  -b "$AUTH_COOKIES" \\
  -d "type=sku" -d "name=Розы красные" -d "unit=шт" -d "sku=ROSE-RED" -d "default_price=500"

# пример: оприходовать 25 шт по 250 ₽
curl -X POST /api/inventory/intake \\
  -H "Accept: application/json" \\
  -b "$AUTH_COOKIES" \\
  -d "product_id=1" -d "qty=25" -d "buy_price=250" -d "arrived_at=2025-02-18" -d "expires_at=2025-02-28"`}
                            </div>

                            <p className="text-xs text-muted-foreground">
                                Все запросы требуют авторизации: выполните вход в панели и используйте Cookie/Authorization, которые
                                выдаёт Laravel Sanctum.
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Касса и смены</CardTitle>
                                <CardDescription>Открытие, закрытие и контроль наличности</CardDescription>
                            </div>
                            <ReceiptText className="h-5 w-5 text-muted-foreground" />
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm leading-relaxed">
                            <ol className="list-decimal space-y-2 pl-4 text-muted-foreground">
                                <li>
                                    Откройте смену: <code>POST /api/cash-shifts</code> с <code>opened_at</code> и
                                    <code>cash_start</code> (начальный остаток).
                                </li>
                                <li>
                                    Ведите выручку: при оплатах вызывайте <code>POST /api/orders/{id}/pay</code> — суммы
                                    попадут в отчёты и смену.
                                </li>
                                <li>
                                    Закройте смену: <code>PATCH /api/cash-shifts/{id}</code> с <code>closed_at</code> и
                                    <code>cash_end</code> для фиксации кассы.
                                </li>
                            </ol>

                            <div className="rounded-lg bg-muted/40 p-3 font-mono text-xs text-muted-foreground">
                                {`# открыть смену с кассой 10 000 ₽
curl -X POST /api/cash-shifts \\
  -H "Accept: application/json" \\
  -b "$AUTH_COOKIES" \\
  -d "opened_at=2025-02-18 10:00:00" -d "cash_start=10000"

# закрыть смену
curl -X PATCH /api/cash-shifts/1 \\
  -H "Accept: application/json" \\
  -b "$AUTH_COOKIES" \\
  -d "closed_at=2025-02-18 22:00:00" -d "cash_end=14500"`}
                            </div>

                            <p className="text-xs text-muted-foreground">
                                Список смен доступен через <code>GET /api/cash-shifts</code>, каждое действие привязывается к
                                пользователю, который авторизован в панели.
                            </p>
                        </CardContent>
                    </Card>
                </section>
            </div>
        </AppLayout>
    );
}
