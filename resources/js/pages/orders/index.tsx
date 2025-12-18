import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import type { PageProps } from '@inertiajs/shared';
import { Clock, Plus, Trash2, Truck } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';

interface OrdersPageProps extends PageProps {
    orders: {
        data: OrderResource[];
        links: { url: string | null; label: string; active: boolean }[];
    };
    products: ProductResource[];
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

interface CustomerLookup {
    id: number;
    name: string | null;
    phone: string | null;
    orders: { id: number; total: string; status: string; created_at: string }[];
}

interface ProductResource {
    id: number;
    name: string;
    type: string;
    unit: string;
    default_price?: string | null;
    available_qty: number;
    bouquet_recipe?: {
        items: { id: number; qty: string; product?: { id: number; name: string; unit: string } | null }[];
    } | null;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Заказы',
        href: '/orders',
    },
];

const statusLabels: Record<string, string> = {
    draft: 'Черновик',
    confirmed: 'Подтверждён',
    in_assembly: 'Сборка',
    ready: 'Готов',
    delivered: 'Доставлен',
    canceled: 'Отменён',
};

const statusSteps: Record<string, string[]> = {
    draft: ['confirmed', 'canceled'],
    confirmed: ['in_assembly', 'canceled'],
    in_assembly: ['ready'],
    ready: ['delivered'],
    delivered: [],
    canceled: [],
};

const paymentLabels: Record<string, string> = {
    paid: 'Оплачено',
    partially_paid: 'Частично',
    unpaid: 'Не оплачено',
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

function formatDate(value: string) {
    return new Intl.DateTimeFormat('ru-RU', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value));
}

export default function OrdersIndex({ orders, products, auth }: OrdersPageProps) {
    const orderForm = useForm({
        customer_name: '',
        customer_phone: '',
        delivery_type: 'pickup',
        notes: '',
        items: [{ product_id: '', qty: '1', price: '' }],
    });

    const [customerLookup, setCustomerLookup] = useState<CustomerLookup | null>(null);
    const [customerLookupError, setCustomerLookupError] = useState<string | null>(null);
    const [isCustomerLookupLoading, setIsCustomerLookupLoading] = useState(false);

    const submitOrder = (event: FormEvent) => {
        event.preventDefault();
        orderForm.post('/orders', {
            onSuccess: () => orderForm.reset(),
        });
    };

    const addItem = () => {
        orderForm.setData('items', [...orderForm.data.items, { product_id: '', qty: '1', price: '' }]);
    };

    const updateItem = (index: number, field: 'product_id' | 'qty' | 'price', value: string) => {
        const next = [...orderForm.data.items];
        next[index] = { ...next[index], [field]: value };

        if (field === 'product_id') {
            const product = products.find((item) => item.id === Number(value));
            if (product?.default_price && !next[index].price) {
                next[index].price = product.default_price.toString();
            }
        }

        orderForm.setData('items', next);
    };

    const removeItem = (index: number) => {
        const next = [...orderForm.data.items];
        next.splice(index, 1);
        orderForm.setData('items', next.length ? next : [{ product_id: '', qty: '1', price: '' }]);
    };

    const itemTotal = (qty: string, price: string) => Number(qty || 0) * Number(price || 0);

    const orderTotal = orderForm.data.items.reduce((sum, item) => sum + itemTotal(item.qty, item.price), 0);

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

    useEffect(() => {
        if (!orderForm.data.customer_phone) {
            return () => {};
        }

        const controller = new AbortController();
        const handle = setTimeout(() => {
            setIsCustomerLookupLoading(true);
            fetch(`/api/customers/lookup?phone=${encodeURIComponent(orderForm.data.customer_phone)}`, {
                signal: controller.signal,
                headers: {
                    Accept: 'application/json',
                },
            })
                .then(async (response) => {
                    if (!response.ok) {
                        setCustomerLookup(null);
                        setCustomerLookupError((await response.json()).message ?? 'Не удалось найти клиента');
                        return;
                    }

                    const data: CustomerLookup = await response.json();
                    setCustomerLookup(data);
                    setCustomerLookupError(null);

                    if (!orderForm.data.customer_name && data.name) {
                        orderForm.setData('customer_name', data.name);
                    }
                })
                .catch((error) => {
                    if (error.name === 'AbortError') return;
                    setCustomerLookup(null);
                    setCustomerLookupError('Не удалось найти клиента');
                })
                .finally(() => setIsCustomerLookupLoading(false));
        }, 300);

        return () => {
            clearTimeout(handle);
            controller.abort();
        };
    }, [orderForm]);

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
                                    onChange={(event) => {
                                        const nextPhone = event.target.value;
                                        orderForm.setData('customer_phone', nextPhone);

                                        if (!nextPhone) {
                                            setCustomerLookup(null);
                                            setCustomerLookupError(null);
                                            setIsCustomerLookupLoading(false);
                                        }
                                    }}
                                    placeholder="+7 (999) 000-00-00"
                                />
                                {orderForm.errors.customer_phone && (
                                    <p className="text-xs text-destructive">{orderForm.errors.customer_phone}</p>
                                )}
                            </div>
                            {orderForm.data.customer_phone && (
                                <div className="md:col-span-2 space-y-2 rounded-lg border border-border/70 bg-muted/30 p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium">Клиент</p>
                                            <p className="text-xs text-muted-foreground">
                                                По номеру телефона подставим существующую карточку
                                            </p>
                                        </div>
                                        {isCustomerLookupLoading && (
                                            <Badge variant="secondary" className="text-[11px]">
                                                Поиск...
                                            </Badge>
                                        )}
                                    </div>

                                    {customerLookup && (
                                        <div className="space-y-3 text-sm">
                                            <div className="grid gap-1 md:grid-cols-3">
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Имя</p>
                                                    <p className="font-medium">{customerLookup.name ?? 'Без имени'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Телефон</p>
                                                    <p className="font-medium">{customerLookup.phone ?? '—'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Заказы</p>
                                                    <p className="font-medium">{customerLookup.orders.length}</p>
                                                </div>
                                            </div>

                                            {!!customerLookup.orders.length && (
                                                <div className="space-y-2">
                                                    <p className="text-xs text-muted-foreground">Последние заказы</p>
                                                    <div className="space-y-2">
                                                        {customerLookup.orders.map((order) => (
                                                            <div key={order.id} className="flex items-center justify-between rounded-md bg-background px-3 py-2 shadow-sm">
                                                                <div className="space-y-0.5">
                                                                    <p className="text-sm font-medium">Заказ #{order.id}</p>
                                                                    <p className="text-xs text-muted-foreground">{formatDate(order.created_at)}</p>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="text-sm font-semibold">{formatCurrency(order.total)}</p>
                                                                    <p className="text-xs text-muted-foreground">{statusLabels[order.status]}</p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {customerLookupError && (
                                        <p className="text-xs text-destructive">{customerLookupError}</p>
                                    )}
                                </div>
                            )}
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
                            <div className="space-y-3 md:col-span-2">
                                <div className="flex items-center justify-between">
                                    <Label>Состав заказа</Label>
                                    <button
                                        type="button"
                                        onClick={addItem}
                                        className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                                    >
                                        <Plus className="h-4 w-4" /> Добавить позицию
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    {orderForm.data.items.map((item, index) => {
                                        const product = products.find((candidate) => candidate.id === Number(item.product_id));

                                        return (
                                            <div
                                                key={`${index}-${item.product_id || 'new'}`}
                                                className="grid gap-3 md:grid-cols-[1.6fr_repeat(3,minmax(0,1fr))_auto] md:items-end"
                                            >
                                                <div className="space-y-2">
                                                    <Label htmlFor={`product_${index}`}>Товар</Label>
                                                    <select
                                                        id={`product_${index}`}
                                                        className="w-full rounded-md border px-3 py-2 text-sm"
                                                        value={item.product_id}
                                                        onChange={(event) =>
                                                            updateItem(index, 'product_id', event.target.value)
                                                        }
                                                        required
                                                    >
                                                        <option value="">Выберите товар</option>
                                                        {products.map((productOption) => (
                                                            <option key={productOption.id} value={productOption.id}>
                                                                {productOption.name} · {productOption.available_qty} {productOption.unit}
                                                                {productOption.type === 'bouquet' ? ' (букет)' : ''}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    {orderForm.errors[`items.${index}.product_id`] && (
                                                        <p className="text-xs text-destructive">
                                                            {orderForm.errors[`items.${index}.product_id`]}
                                                        </p>
                                                    )}
                                                    {product?.bouquet_recipe && (
                                                        <p className="text-xs text-muted-foreground">
                                                            Рецепт: {product.bouquet_recipe.items.map((component) => {
                                                                const name = component.product?.name ?? '—';
                                                                return `${component.qty} ${component.product?.unit ?? ''} ${name}`;
                                                            }).join(', ')}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor={`qty_${index}`}>Количество</Label>
                                                    <Input
                                                        id={`qty_${index}`}
                                                        type="number"
                                                        min={0.001}
                                                        step="0.001"
                                                        value={item.qty}
                                                        onChange={(event) => updateItem(index, 'qty', event.target.value)}
                                                        required
                                                    />
                                                    {orderForm.errors[`items.${index}.qty`] && (
                                                        <p className="text-xs text-destructive">
                                                            {orderForm.errors[`items.${index}.qty`]}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor={`price_${index}`}>Цена</Label>
                                                    <Input
                                                        id={`price_${index}`}
                                                        type="number"
                                                        min={0}
                                                        step="0.01"
                                                        value={item.price}
                                                        onChange={(event) => updateItem(index, 'price', event.target.value)}
                                                        required
                                                    />
                                                    {orderForm.errors[`items.${index}.price`] && (
                                                        <p className="text-xs text-destructive">
                                                            {orderForm.errors[`items.${index}.price`]}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Сумма</Label>
                                                    <div className="rounded-md border px-3 py-2 text-sm">
                                                        {formatCurrency(itemTotal(item.qty, item.price).toString())}
                                                    </div>
                                                </div>
                                                <div className="flex justify-end pb-1 md:pb-3">
                                                    <button
                                                        type="button"
                                                        onClick={() => removeItem(index)}
                                                        className="inline-flex h-9 items-center justify-center rounded-md border px-3 text-sm hover:bg-muted"
                                                        aria-label="Удалить позицию"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {typeof orderForm.errors.items === 'string' && (
                                    <p className="text-xs text-destructive">{orderForm.errors.items}</p>
                                )}
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label className="flex items-center justify-between">
                                    <span>Комментарий</span>
                                    <span className="text-xs text-muted-foreground">Итого: {formatCurrency(orderTotal.toString())}</span>
                                </Label>
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
                                            <Badge
                                                variant={
                                                    order.payment_status === 'paid'
                                                        ? 'default'
                                                        : order.payment_status === 'partially_paid'
                                                          ? 'outline'
                                                          : 'secondary'
                                                }
                                            >
                                                {paymentLabels[order.payment_status] ?? order.payment_status}
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
