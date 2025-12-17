import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import {
    AlarmClock,
    ArrowRight,
    Banknote,
    Flower2,
    ListChecks,
    Package,
    PackageSearch,
    PhoneCall,
    PlusCircle,
    Receipt,
    ScanQrCode,
    Truck,
    UsersRound,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
    },
];

type OrderStatus = 'Новый' | 'В работе' | 'Готов' | 'Доставка/выдача' | 'Завершён';

type PaymentMethod = 'cash' | 'card' | 'transfer';

interface Order {
    id: string;
    customer: string;
    total: number;
    items: string;
    delivery: string;
    time: string;
    tags: string[];
    action: string;
    status: OrderStatus;
    paymentMethod: PaymentMethod;
}

interface InventoryItem {
    name: string;
    details: string;
    left: number;
    critical?: boolean;
    type: 'lowStock' | 'expiring';
}

interface ClientProfile {
    name: string;
    phone: string;
    segment: string;
    note: string;
    lastOrder: string;
    prefers: string;
}

interface ShiftTotals {
    cash: number;
    card: number;
    refunds: number;
    drawer: number;
    window: string;
}

interface DashboardState {
    orders: Order[];
    clients: ClientProfile[];
    inventory: InventoryItem[];
    autoWriteOff: {
        order: string;
        components: { name: string; qty: string; batch: string }[];
    };
    shift: ShiftTotals;
    payments: { title: string; note: string; amount: number }[];
}

const currency = new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
});

const STORAGE_KEY = 'gulalem-dashboard-state';

const statusOrder: OrderStatus[] = ['Новый', 'В работе', 'Готов', 'Доставка/выдача', 'Завершён'];

const statusHints: Record<Exclude<OrderStatus, 'Завершён'>, string> = {
    Новый: 'Нужно принять',
    'В работе': 'Сборка',
    Готов: 'Ожидает выдачи',
    'Доставка/выдача': 'В пути',
};

const defaultAction: Record<OrderStatus, string> = {
    Новый: 'Принять',
    'В работе': 'Отметить готов',
    Готов: 'Передать',
    'Доставка/выдача': 'Закрыть заказ',
    Завершён: 'Завершён',
};

const initialState: DashboardState = {
    orders: [
        {
            id: '#A-241',
            customer: 'Дарья С.',
            total: 5200,
            items: '11 роз Freedom, лента, открытка',
            delivery: 'Самовывоз',
            time: 'Через 25 мин',
            tags: ['Оплата при получении', 'Скидка 5%'],
            action: 'Принять',
            status: 'Новый',
            paymentMethod: 'cash',
        },
        {
            id: '#A-239',
            customer: 'Telegram / Быстрый',
            total: 2700,
            items: 'Коробка конфет + зелень',
            delivery: 'Курьер',
            time: '12:15',
            tags: ['Оплачено', 'Доставка'],
            action: 'Назначить',
            status: 'Новый',
            paymentMethod: 'card',
        },
        {
            id: '#A-236',
            customer: 'Ирина К.',
            total: 7900,
            items: 'Букет «Тюльпаны микс» + шар',
            delivery: 'Курьер',
            time: '12:45',
            tags: ['Оплачено', 'Отметить сборку'],
            action: 'Отметить готов',
            status: 'В работе',
            paymentMethod: 'card',
        },
        {
            id: '#A-235',
            customer: 'Колл-центр',
            total: 3100,
            items: 'Хризантема кустовая ×15',
            delivery: 'Самовывоз',
            time: '13:10',
            tags: ['Безнал', 'Фискализация'],
            action: 'Пробить чек',
            status: 'В работе',
            paymentMethod: 'transfer',
        },
        {
            id: '#A-231',
            customer: 'Доставка Яндекс',
            total: 4400,
            items: 'Букет авторский + пакет',
            delivery: 'Курьер',
            time: 'До 13:30',
            tags: ['Оплачено', 'Маршрут'],
            action: 'Отдать курьеру',
            status: 'Готов',
            paymentMethod: 'card',
        },
        {
            id: '#A-229',
            customer: 'Андрей П.',
            total: 1900,
            items: '1 гортензия, 3 пионовидные',
            delivery: 'Самовывоз',
            time: '13:00',
            tags: ['Нужно доплата'],
            action: 'Получить оплату',
            status: 'Готов',
            paymentMethod: 'cash',
        },
        {
            id: '#A-228',
            customer: 'Курьер Мария',
            total: 6500,
            items: 'Бокс Premium, шар, открытка',
            delivery: 'Доставка',
            time: '13:20',
            tags: ['Online', 'Чек отправлен'],
            action: 'Подтвердить вручение',
            status: 'Доставка/выдача',
            paymentMethod: 'card',
        },
        {
            id: '#A-226',
            customer: 'Клиент на месте',
            total: 1200,
            items: 'Гиацинт ×5, крафт',
            delivery: 'Самовывоз',
            time: 'Сейчас',
            tags: ['Оплата картой'],
            action: 'Закрыть заказ',
            status: 'Доставка/выдача',
            paymentMethod: 'card',
        },
    ],
    clients: [
        {
            name: 'Наталья Романова',
            phone: '+7 921 000-12-13',
            segment: 'VIP',
            note: 'Любит белые розы и всегда доп. упаковка «сатин»',
            lastOrder: 'Последний заказ 3 дн. назад',
            prefers: 'Белые розы, 19 шт.',
        },
        {
            name: 'Сергей (Telegram)',
            phone: '@sergey_flowers',
            segment: 'Повтор',
            note: 'Попросил поздравить маму в 18:00, нужен чек на почту',
            lastOrder: '4 заказа за месяц',
            prefers: 'Пионы/фрезия',
        },
        {
            name: 'Дарья, офис',
            phone: '8 (812) 555-88-12',
            segment: 'B2B',
            note: 'Согласованные подборки к корпоративу, 12 марта',
            lastOrder: 'Счёт на оплату сформирован',
            prefers: 'Доставка в понедельник',
        },
    ],
    inventory: [
        {
            name: 'Роза Freedom 60 см',
            details: 'Остаток по партии #304 · срез 09.02',
            left: 38,
            type: 'lowStock',
        },
        {
            name: 'Упаковка «Крафт»',
            details: 'FIFO: партия #118',
            left: 14,
            type: 'lowStock',
        },
        {
            name: 'Лента бордо',
            details: 'Партия #77 · рекомендовано пополнить',
            left: 9,
            type: 'lowStock',
        },
        {
            name: 'Гиацинт белый',
            details: 'Партия #289 · истекает сегодня',
            left: 26,
            critical: true,
            type: 'expiring',
        },
        {
            name: 'Хризантема кустовая',
            details: 'Партия #271 · истекает завтра',
            left: 34,
            critical: false,
            type: 'expiring',
        },
        {
            name: 'Эвкалипт',
            details: 'Партия #252 · 2 дня до списания',
            left: 18,
            critical: false,
            type: 'expiring',
        },
    ],
    autoWriteOff: {
        order: 'A-236',
        components: [
            { name: 'Тюльпан микс', qty: '15 шт · партия #101', batch: 'Срез 08.02 · осталось 42' },
            { name: 'Зелень рускус', qty: '6 шт · партия #198', batch: 'Срез 10.02 · осталось 23' },
            { name: 'Упаковка матовая', qty: '1 шт · партия #120', batch: 'Поступление 07.02 · осталось 17' },
        ],
    },
    shift: {
        cash: 32800,
        card: 149500,
        refunds: 3200,
        drawer: 4000,
        window: 'Открыта в 09:00 · ответственный: Полина',
    },
    payments: [
        { title: 'Оплата заказа #A-235', note: 'Карта · чек отправлен', amount: 3100 },
        { title: 'Приход партии #304', note: 'Закупка через кассу', amount: 18600 },
        { title: 'Возврат #A-219', note: 'Наличные · оформлен', amount: 1200 },
    ],
};

function formatCurrency(value: number) {
    return currency.format(Math.max(0, value));
}

export default function Dashboard() {
    const [state, setState] = useState<DashboardState>(() => {
        if (typeof window === 'undefined') {
            return initialState;
        }

        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) return initialState;

        try {
            return {
                ...initialState,
                ...JSON.parse(saved),
            } as DashboardState;
        } catch (error) {
            console.error('Failed to parse saved dashboard state', error);
            return initialState;
        }
    });

    const [orderDialogOpen, setOrderDialogOpen] = useState(false);
    const [inventoryDialogOpen, setInventoryDialogOpen] = useState(false);
    const [orderDraft, setOrderDraft] = useState({
        customer: '',
        items: '',
        total: 0,
        delivery: 'Самовывоз',
        paymentMethod: 'cash' as PaymentMethod,
    });
    const [inventoryDraft, setInventoryDraft] = useState({
        name: '',
        details: '',
        left: 1,
        type: 'lowStock' as InventoryItem['type'],
        critical: false,
    });

    useEffect(() => {
        if (typeof window === 'undefined') return;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }, [state]);

    const lowStock = useMemo(
        () => state.inventory.filter((item) => item.type === 'lowStock'),
        [state.inventory],
    );

    const expiring = useMemo(
        () => state.inventory.filter((item) => item.type === 'expiring'),
        [state.inventory],
    );

    const pipeline = useMemo(
        () =>
            statusOrder
                .filter((status) => status !== 'Завершён')
                .map((status) => ({
                    status,
                    hint: statusHints[status as keyof typeof statusHints],
                    orders: state.orders.filter((order) => order.status === status),
                })),
        [state.orders],
    );

    const revenueToday = useMemo(
        () => state.payments.reduce((sum, payment) => sum + payment.amount, 0),
        [state.payments],
    );

    const averageCheck = useMemo(
        () => (state.orders.length ? Math.round(revenueToday / state.orders.length) : 0),
        [revenueToday, state.orders.length],
    );

    const activeOrders = useMemo(
        () => state.orders.filter((order) => order.status !== 'Завершён'),
        [state.orders],
    );

    const handleAdvanceOrder = (id: string) => {
        setState((prev) => {
            let updatedPayments = prev.payments;
            let updatedShift = prev.shift;

            const updatedOrders = prev.orders.map((order) => {
                if (order.id !== id) return order;

                const currentIndex = statusOrder.indexOf(order.status);
                const nextStatus = statusOrder[currentIndex + 1];

                if (!nextStatus) return order;

                const updated = {
                    ...order,
                    status: nextStatus,
                    action: defaultAction[nextStatus],
                };

                if (nextStatus === 'Завершён') {
                    updatedPayments = [
                        {
                            title: `Оплата заказа ${order.id}`,
                            note:
                                order.paymentMethod === 'cash'
                                    ? 'Наличные · закрыт'
                                    : order.paymentMethod === 'card'
                                      ? 'Карта · закрыт'
                                      : 'Перевод · закрыт',
                            amount: order.total,
                        },
                        ...prev.payments,
                    ];

                    updatedShift = {
                        ...prev.shift,
                        cash:
                            prev.shift.cash +
                            (order.paymentMethod === 'cash' ? order.total : 0),
                        card:
                            prev.shift.card +
                            (order.paymentMethod === 'card' ? order.total : 0),
                        drawer:
                            prev.shift.drawer +
                            (order.paymentMethod === 'cash' ? order.total : 0),
                    };
                }

                return updated;
            });

            return { ...prev, orders: updatedOrders, payments: updatedPayments, shift: updatedShift };
        });
    };

    const handleAddOrder = () => {
        if (!orderDraft.customer || !orderDraft.items || !orderDraft.total) return;

        setState((prev) => {
            const newId = `#A-${Math.floor(200 + Math.random() * 200)}`;
            const newOrder: Order = {
                id: newId,
                customer: orderDraft.customer,
                items: orderDraft.items,
                total: Number(orderDraft.total),
                delivery: orderDraft.delivery,
                time: 'Новый заказ',
                tags: ['Создано вручную'],
                status: 'Новый',
                action: defaultAction.Новый,
                paymentMethod: orderDraft.paymentMethod,
            };

            return { ...prev, orders: [newOrder, ...prev.orders] };
        });

        setOrderDraft({ customer: '', items: '', total: 0, delivery: 'Самовывоз', paymentMethod: 'cash' });
        setOrderDialogOpen(false);
    };

    const handleAddInventory = () => {
        if (!inventoryDraft.name || !inventoryDraft.details || !inventoryDraft.left) return;

        setState((prev) => ({
            ...prev,
            inventory: [
                {
                    name: inventoryDraft.name,
                    details: inventoryDraft.details,
                    left: Number(inventoryDraft.left),
                    type: inventoryDraft.type,
                    critical: inventoryDraft.critical,
                },
                ...prev.inventory,
            ],
        }));

        setInventoryDraft({ name: '', details: '', left: 1, type: 'lowStock', critical: false });
        setInventoryDialogOpen(false);
    };

    const summaryCards = useMemo(
        () => [
            {
                title: 'Выручка сегодня',
                value: formatCurrency(revenueToday),
                trend: { label: '+14% к вчера', positive: true },
                context: `${state.orders.length} заказов, средний чек ${formatCurrency(averageCheck)}`,
                icon: Banknote,
            },
            {
                title: 'В работе',
                value: `${activeOrders.length} заказов`,
                trend: { label: 'SLA 37 мин', positive: true },
                context: `${pipeline
                    .map((column) => `${column.status}: ${column.orders.length}`)
                    .join(' · ')}`,
                icon: AlarmClock,
            },
            {
                title: 'Склад',
                value: `${state.inventory.length} партий`,
                trend: { label: 'FIFO', positive: true },
                context: `${state.inventory.filter((item) => item.type === 'expiring').length} требуют внимания`,
                icon: Package,
            },
            {
                title: 'Клиенты',
                value: `${state.clients.length} активных`,
                trend: { label: '+6 новых', positive: true },
                context: 'Повторные продажи и сегменты обновлены',
                icon: UsersRound,
            },
        ],
        [activeOrders.length, averageCheck, pipeline, revenueToday, state.clients.length, state.inventory, state.orders.length],
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-hidden p-4">
                <header className="flex flex-col gap-3 rounded-xl border bg-background/60 p-4 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/70 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-1">
                        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                            Flower CRM / PWA
                        </p>
                        <h1 className="text-2xl font-semibold leading-tight">Рабочий день магазина</h1>
                        <p className="max-w-3xl text-sm text-muted-foreground">
                            Принимаем заказы за 60 секунд, списываем по FIFO, контролируем маржу и наличные. Все основные сценарии вынесены на один экран.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 md:justify-end">
                        <Dialog open={inventoryDialogOpen} onOpenChange={setInventoryDialogOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="lg" className="gap-2">
                                    <ScanQrCode className="size-4" />
                                    Инвентаризация
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Зафиксировать движение</DialogTitle>
                                    <DialogDescription>
                                        Добавьте новую партию или отметьте списание — карточка сразу появится в блоке склада.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-3 py-2">
                                    <div className="space-y-1">
                                        <Label htmlFor="inventory-name">Название</Label>
                                        <Input
                                            id="inventory-name"
                                            value={inventoryDraft.name}
                                            onChange={(event) =>
                                                setInventoryDraft((prev) => ({
                                                    ...prev,
                                                    name: event.target.value,
                                                }))
                                            }
                                            placeholder="Роза White O'Hara"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="inventory-details">Детали</Label>
                                        <Input
                                            id="inventory-details"
                                            value={inventoryDraft.details}
                                            onChange={(event) =>
                                                setInventoryDraft((prev) => ({
                                                    ...prev,
                                                    details: event.target.value,
                                                }))
                                            }
                                            placeholder="Партия #305 · поступление 12.02"
                                        />
                                    </div>
                                    <div className="grid gap-3 md:grid-cols-2">
                                        <div className="space-y-1">
                                            <Label htmlFor="inventory-left">Остаток</Label>
                                            <Input
                                                id="inventory-left"
                                                type="number"
                                                min={0}
                                                value={inventoryDraft.left}
                                                onChange={(event) =>
                                                    setInventoryDraft((prev) => ({
                                                        ...prev,
                                                        left: Number(event.target.value),
                                                    }))
                                                }
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label htmlFor="inventory-type">Тип операции</Label>
                                            <select
                                                id="inventory-type"
                                                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                                                value={inventoryDraft.type}
                                                onChange={(event) =>
                                                    setInventoryDraft((prev) => ({
                                                        ...prev,
                                                        type: event.target.value as InventoryItem['type'],
                                                    }))
                                                }
                                            >
                                                <option value="lowStock">Пополнить / низкий остаток</option>
                                                <option value="expiring">Партия к списанию</option>
                                            </select>
                                        </div>
                                    </div>
                                    <label className="flex items-center gap-2 text-sm">
                                        <input
                                            type="checkbox"
                                            className="rounded border-muted"
                                            checked={inventoryDraft.critical}
                                            onChange={(event) =>
                                                setInventoryDraft((prev) => ({
                                                    ...prev,
                                                    critical: event.target.checked,
                                                }))
                                            }
                                        />
                                        Отметить как критичную партию
                                    </label>
                                </div>
                                <DialogFooter>
                                    <Button onClick={handleAddInventory}>Сохранить</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>

                        <Dialog open={orderDialogOpen} onOpenChange={setOrderDialogOpen}>
                            <DialogTrigger asChild>
                                <Button size="lg" className="gap-2">
                                    <PlusCircle className="size-4" />
                                    Новый заказ
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Создать заказ</DialogTitle>
                                    <DialogDescription>
                                        Минимальный набор данных, чтобы сразу поставить заказ в работу и отразить оплату.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-3 py-2">
                                    <div className="space-y-1">
                                        <Label htmlFor="order-customer">Клиент</Label>
                                        <Input
                                            id="order-customer"
                                            value={orderDraft.customer}
                                            onChange={(event) =>
                                                setOrderDraft((prev) => ({
                                                    ...prev,
                                                    customer: event.target.value,
                                                }))
                                            }
                                            placeholder="Имя или @username"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="order-items">Состав заказа</Label>
                                        <Input
                                            id="order-items"
                                            value={orderDraft.items}
                                            onChange={(event) =>
                                                setOrderDraft((prev) => ({
                                                    ...prev,
                                                    items: event.target.value,
                                                }))
                                            }
                                            placeholder="Букет, упаковка, открытка"
                                        />
                                    </div>
                                    <div className="grid gap-3 md:grid-cols-2">
                                        <div className="space-y-1">
                                            <Label htmlFor="order-total">Сумма</Label>
                                            <Input
                                                id="order-total"
                                                type="number"
                                                min={0}
                                                value={orderDraft.total}
                                                onChange={(event) =>
                                                    setOrderDraft((prev) => ({
                                                        ...prev,
                                                        total: Number(event.target.value),
                                                    }))
                                                }
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label htmlFor="order-delivery">Доставка</Label>
                                            <select
                                                id="order-delivery"
                                                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                                                value={orderDraft.delivery}
                                                onChange={(event) =>
                                                    setOrderDraft((prev) => ({
                                                        ...prev,
                                                        delivery: event.target.value,
                                                    }))
                                                }
                                            >
                                                <option value="Самовывоз">Самовывоз</option>
                                                <option value="Курьер">Курьер</option>
                                                <option value="Доставка">Доставка</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="order-payment">Оплата</Label>
                                        <select
                                            id="order-payment"
                                            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                                            value={orderDraft.paymentMethod}
                                            onChange={(event) =>
                                                setOrderDraft((prev) => ({
                                                    ...prev,
                                                    paymentMethod: event.target.value as PaymentMethod,
                                                }))
                                            }
                                        >
                                            <option value="cash">Наличные</option>
                                            <option value="card">Карта</option>
                                            <option value="transfer">Перевод</option>
                                        </select>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button onClick={handleAddOrder}>Создать и отправить в работу</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </header>

                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" id="reports">
                    {summaryCards.map((card) => (
                        <Card key={card.title} className="border-border/80">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div className="space-y-2">
                                    <CardTitle className="text-sm text-muted-foreground">
                                        {card.title}
                                    </CardTitle>
                                    <div className="text-2xl font-semibold">{card.value}</div>
                                    <CardDescription className="flex items-center gap-2 text-xs">
                                        <Badge
                                            variant={card.trend.positive ? 'default' : 'destructive'}
                                            className="px-2 py-1 text-[11px]"
                                        >
                                            {card.trend.label}
                                        </Badge>
                                        <span>{card.context}</span>
                                    </CardDescription>
                                </div>
                                <card.icon className="size-8 text-muted-foreground" />
                            </CardHeader>
                        </Card>
                    ))}
                </section>

                <section className="grid gap-4 lg:grid-cols-3" id="orders">
                    <Card className="lg:col-span-2">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Очередь заказов</CardTitle>
                                <CardDescription>
                                    Статусы синхронизируются с пушами и экранами флористов
                                </CardDescription>
                            </div>
                            <Badge className="px-3 py-1 text-[11px]" variant="secondary">
                                SLA 45 мин
                            </Badge>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                {pipeline.map((column) => (
                                    <div
                                        key={column.status}
                                        className="rounded-lg border bg-muted/30 p-3 shadow-sm"
                                    >
                                        <div className="mb-3 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Badge variant="secondary">{column.status}</Badge>
                                                <span className="text-xs text-muted-foreground">
                                                    {column.hint}
                                                </span>
                                            </div>
                                            <Badge className="bg-primary/10 text-xs text-primary">
                                                {column.orders.length}
                                            </Badge>
                                        </div>
                                        <div className="space-y-3">
                                        {column.orders.map((order) => (
                                            <div
                                                key={order.id}
                                                className="rounded-lg border bg-background p-3"
                                            >
                                                    <div className="flex items-center justify-between">
                                                        <div className="font-semibold">{order.id}</div>
                                                        <Badge variant="outline">{order.total}</Badge>
                                                    </div>
                                                    <p className="mt-1 text-sm font-medium">
                                                        {order.customer}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {order.items}
                                                    </p>
                                                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                                                        <span className="inline-flex items-center gap-1 rounded-md bg-secondary/60 px-2 py-1 text-secondary-foreground">
                                                            <Truck className="size-3" />
                                                            {order.delivery}
                                                        </span>
                                                        <span className="inline-flex items-center gap-1 rounded-md bg-secondary/60 px-2 py-1 text-secondary-foreground">
                                                            <AlarmClock className="size-3" />
                                                            {order.time}
                                                        </span>
                                                    </div>
                                                    <div className="mt-3 flex flex-wrap gap-2">
                                                        {order.tags.map((tag) => (
                                                            <Badge key={tag} variant="secondary">
                                                                {tag}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                    <div className="mt-4 flex items-center justify-between">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="gap-1"
                                                            onClick={() => handleAdvanceOrder(order.id)}
                                                        >
                                                            <ListChecks className="size-4" />
                                                            {order.action}
                                                        </Button>
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            onClick={() => handleAdvanceOrder(order.id)}
                                                        >
                                                            <ArrowRight className="size-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="h-full" id="customers">
                        <CardHeader>
                            <CardTitle>Клиенты дня</CardTitle>
                            <CardDescription>
                                Быстрый поиск по телефону, сегментация и повторы
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {state.clients.map((client) => (
                                <div
                                    key={client.name}
                                    className="rounded-lg border bg-muted/30 p-3"
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-semibold">{client.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {client.phone}
                                            </p>
                                        </div>
                                        <Badge variant="outline">{client.segment}</Badge>
                                    </div>
                                    <p className="mt-2 text-sm">{client.note}</p>
                                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                                        <span className="inline-flex items-center gap-1 rounded-md bg-secondary/60 px-2 py-1 text-secondary-foreground">
                                            <PhoneCall className="size-3" />
                                            {client.lastOrder}
                                        </span>
                                        <span className="inline-flex items-center gap-1 rounded-md bg-secondary/60 px-2 py-1 text-secondary-foreground">
                                            <Flower2 className="size-3" />
                                            {client.prefers}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </section>

                <section className="grid gap-4 lg:grid-cols-3" id="inventory">
                    <Card className="lg:col-span-2">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Склад по партиям</CardTitle>
                                <CardDescription>
                                    FIFO списание, срок годности и контроль маржи
                                </CardDescription>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-2"
                                onClick={() => setInventoryDialogOpen(true)}
                            >
                                <PackageSearch className="size-4" />
                                Приход/списание
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="rounded-lg border bg-muted/30 p-3">
                                    <div className="mb-2 flex items-center justify-between">
                                        <div className="font-semibold">Низкий остаток</div>
                                        <Badge variant="destructive">FIFO</Badge>
                                    </div>
                                    <div className="space-y-3">
                                        {lowStock.map((item) => (
                                            <div key={item.name} className="flex items-start justify-between gap-2">
                                                <div>
                                                    <p className="font-medium">{item.name}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {item.details}
                                                    </p>
                                                </div>
                                                <Badge variant="outline">{item.left} шт</Badge>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="rounded-lg border bg-muted/30 p-3">
                                    <div className="mb-2 flex items-center justify-between">
                                        <div className="font-semibold">Партии к списанию</div>
                                        <Badge variant="secondary">Просрок</Badge>
                                    </div>
                                    <div className="space-y-3">
                                        {expiring.map((item) => (
                                            <div key={item.name} className="flex items-start justify-between gap-2">
                                                <div>
                                                    <p className="font-medium">{item.name}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {item.details}
                                                    </p>
                                                </div>
                                                <Badge variant={item.critical ? 'destructive' : 'outline'}>
                                                    {item.left} шт
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-lg border bg-muted/30 p-4">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="secondary">Автосписание</Badge>
                                            <span className="text-sm font-semibold">Заказ #{state.autoWriteOff.order}</span>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            Рецепт букета разложен на 3 партии, старшие списаны первыми. Любые отрицательные остатки подсвечиваются.
                                        </p>
                                    </div>
                                    <Button size="sm" variant="ghost" className="gap-2">
                                        <ListChecks className="size-4" />
                                        Проверить движение
                                    </Button>
                                </div>
                                <div className="mt-3 grid gap-2 md:grid-cols-3">
                                    {state.autoWriteOff.components.map((component) => (
                                        <div
                                            key={component.name}
                                            className="rounded-lg border bg-background p-3"
                                        >
                                            <div className="flex items-center justify-between">
                                                <p className="font-medium">{component.name}</p>
                                                <Badge variant="outline">{component.qty}</Badge>
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                {component.batch}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card id="cash-desk">
                        <CardHeader>
                            <CardTitle>Смена и касса</CardTitle>
                            <CardDescription>
                                Поддерживаются наличные, карта, перевод и смешанные оплаты
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="rounded-lg border bg-muted/30 p-3">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <p className="text-sm font-semibold">Смена открыта</p>
                                        <p className="text-xs text-muted-foreground">{state.shift.window}</p>
                                    </div>
                                    <Badge variant="secondary">Онлайн</Badge>
                                </div>
                                <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                                    {[
                                        { label: 'Наличные', value: formatCurrency(state.shift.cash) },
                                        { label: 'Безнал / онлайн', value: formatCurrency(state.shift.card) },
                                        { label: 'Возвраты', value: formatCurrency(state.shift.refunds) },
                                        { label: 'Сдача в кассе', value: formatCurrency(state.shift.drawer) },
                                    ].map((metric) => (
                                        <div key={metric.label} className="rounded-lg border bg-background p-3">
                                            <p className="text-xs text-muted-foreground">{metric.label}</p>
                                            <p className="text-lg font-semibold">{metric.value}</p>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                                    <Badge variant="outline">Возвраты учтены</Badge>
                                    <Badge variant="outline">Чеки в один тап</Badge>
                                </div>
                            </div>

                            <div className="rounded-lg border bg-muted/30 p-3">
                                <div className="flex items-center justify-between">
                                    <p className="font-semibold">Последние оплаты</p>
                                    <Receipt className="size-4 text-muted-foreground" />
                                </div>
                                <div className="mt-3 space-y-2 text-sm">
                                    {state.payments.map((payment) => (
                                        <div
                                            key={payment.title}
                                            className="flex items-center justify-between rounded-lg border bg-background px-3 py-2"
                                        >
                                            <div>
                                                <p className="font-medium">{payment.title}</p>
                                                <p className="text-xs text-muted-foreground">{payment.note}</p>
                                            </div>
                                            <Badge variant="secondary">{formatCurrency(payment.amount)}</Badge>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </section>

                <section className="grid gap-4 lg:grid-cols-3" id="automation">
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Автоматизации и контроль</CardTitle>
                            <CardDescription>
                                Рабочие напоминания, просрочка, маржа, уведомления для управляющего
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-3 md:grid-cols-2">
                            {automation.map((item) => (
                                <div key={item.title} className="rounded-lg border bg-muted/30 p-4">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="secondary">{item.badge}</Badge>
                                        <p className="font-semibold">{item.title}</p>
                                    </div>
                                    <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
                                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                                        {item.tags.map((tag) => (
                                            <Badge key={tag} variant="outline">
                                                {tag}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card id="bouquets">
                        <CardHeader>
                            <CardTitle>Шаблоны букетов</CardTitle>
                            <CardDescription>
                                Рецепты сразу показывают себестоимость и списания
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {bouquetPresets.map((preset) => (
                                <div
                                    key={preset.title}
                                    className="rounded-lg border bg-muted/30 p-3"
                                >
                                    <div className="flex items-center justify-between">
                                        <p className="font-semibold">{preset.title}</p>
                                        <Badge variant="outline">{preset.cost}</Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        {preset.description}
                                    </p>
                                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                                        {preset.components.map((component) => (
                                            <Badge key={component} variant="secondary">
                                                {component}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </section>
            </div>
        </AppLayout>
    );
}

const automation = [
    {
        badge: 'Просрочка',
        title: 'Контроль свежести',
        description: 'Напоминания о партиях за 24 часа до списания, автоматическое формирование акта списания.',
        tags: ['Push продавцу', 'Отчёт владельцу', 'FIFO'],
    },
    {
        badge: 'Маржа',
        title: 'Расчёт себестоимости букета',
        description: 'Букет строится из рецептов, закупочные цены и остатки подставляются автоматически.',
        tags: ['Рецепты', 'Автосписание', 'Margin dashboard'],
    },
    {
        badge: 'Доставка',
        title: 'Маршрутный лист курьера',
        description: 'Передача статусов доставок и отправка ссылки клиенту на отслеживание.',
        tags: ['SMS/WhatsApp', 'Курьеры', 'Чеки'],
    },
    {
        badge: 'Клиенты',
        title: 'Повторные продажи',
        description: 'Напоминание о днях рождения и предложенный набор товаров в один тап.',
        tags: ['ДР', 'Предзаполненный заказ', 'Сегменты'],
    },
];

const bouquetPresets = [
    {
        title: '«11 роз»',
        cost: '₽1 180 себестоимость',
        description: 'Автоподстановка партии и ленты, скидка в чековом принтере.',
        components: ['Роза Freedom ×11', 'Лента атласная', 'Упаковка матовая'],
    },
    {
        title: '«Авторский микс»',
        cost: '₽2 430 себестоимость',
        description: 'Три слоя упаковки, карточка и персональная скидка VIP.',
        components: ['Пионы ×5', 'Гиацинты ×7', 'Зелень рускус', 'Открытка'],
    },
    {
        title: '«Коробка Mini»',
        cost: '₽980 себестоимость',
        description: 'Сборка в 2 шага, подсказка по марже и остатку коробок.',
        components: ['Коробка крафт', 'Хризантема ×9', 'Аспидистра'],
    },
];
