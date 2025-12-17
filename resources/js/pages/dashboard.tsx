import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
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

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
    },
];

export default function Dashboard() {
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
                        <Button variant="outline" size="lg" className="gap-2">
                            <ScanQrCode className="size-4" />
                            Инвентаризация
                        </Button>
                        <Button size="lg" className="gap-2">
                            <PlusCircle className="size-4" />
                            Новый заказ
                        </Button>
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
                                                        <Button size="sm" variant="outline" className="gap-1">
                                                            <ListChecks className="size-4" />
                                                            {order.action}
                                                        </Button>
                                                        <Button size="icon" variant="ghost">
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
                            {clients.map((client) => (
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
                            <Button variant="outline" size="sm" className="gap-2">
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
                                                <Badge variant="outline">{item.left}</Badge>
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
                                                    {item.left}
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
                                            <span className="text-sm font-semibold">Заказ #{autoWriteOff.order}</span>
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
                                    {autoWriteOff.components.map((component) => (
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
                                        <p className="text-xs text-muted-foreground">{shiftWindow}</p>
                                    </div>
                                    <Badge variant="secondary">Онлайн</Badge>
                                </div>
                                <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                                    {shiftMetrics.map((metric) => (
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
                                    {payments.map((payment) => (
                                        <div
                                            key={payment.title}
                                            className="flex items-center justify-between rounded-lg border bg-background px-3 py-2"
                                        >
                                            <div>
                                                <p className="font-medium">{payment.title}</p>
                                                <p className="text-xs text-muted-foreground">{payment.note}</p>
                                            </div>
                                            <Badge variant="secondary">{payment.amount}</Badge>
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

const summaryCards = [
    {
        title: 'Выручка сегодня',
        value: '₽182 300',
        trend: { label: '+14% к вчера', positive: true },
        context: '46 заказов, средний чек ₽3 960',
        icon: Banknote,
    },
    {
        title: 'В работе',
        value: '12 заказов',
        trend: { label: 'SLA 37 мин', positive: true },
        context: '3 доставки, 4 самовывоз, 5 сборок',
        icon: AlarmClock,
    },
    {
        title: 'Склад',
        value: '174 партии',
        trend: { label: 'FIFO', positive: true },
        context: '8 позиций требуют действий',
        icon: Package,
    },
    {
        title: 'Клиенты',
        value: '1 248 активных',
        trend: { label: '+6 новых', positive: true },
        context: '9 повторных в течение 30 дней',
        icon: UsersRound,
    },
];

const pipeline = [
    {
        status: 'Новый',
        hint: 'Нужно принять',
        orders: [
            {
                id: '#A-241',
                customer: 'Дарья С.',
                total: '₽5 200',
                items: '11 роз Freedom, лента, открытка',
                delivery: 'Самовывоз',
                time: 'Через 25 мин',
                tags: ['Оплата при получении', 'Скидка 5%'],
                action: 'Принять',
            },
            {
                id: '#A-239',
                customer: 'Telegram / Быстрый',
                total: '₽2 700',
                items: 'Коробка конфет + зелень',
                delivery: 'Курьер',
                time: '12:15',
                tags: ['Оплачено', 'Доставка'],
                action: 'Назначить',
            },
        ],
    },
    {
        status: 'В работе',
        hint: 'Сборка',
        orders: [
            {
                id: '#A-236',
                customer: 'Ирина К.',
                total: '₽7 900',
                items: 'Букет «Тюльпаны микс» + шар',
                delivery: 'Курьер',
                time: '12:45',
                tags: ['Оплачено', 'Отметить сборку'],
                action: 'Отметить готов',
            },
            {
                id: '#A-235',
                customer: 'Колл-центр',
                total: '₽3 100',
                items: 'Хризантема кустовая ×15',
                delivery: 'Самовывоз',
                time: '13:10',
                tags: ['Безнал', 'Фискализация'],
                action: 'Пробить чек',
            },
        ],
    },
    {
        status: 'Готов',
        hint: 'Ожидает выдачи',
        orders: [
            {
                id: '#A-231',
                customer: 'Доставка Яндекс',
                total: '₽4 400',
                items: 'Букет авторский + пакет',
                delivery: 'Курьер',
                time: 'До 13:30',
                tags: ['Оплачено', 'Маршрут'],
                action: 'Отдать курьеру',
            },
            {
                id: '#A-229',
                customer: 'Андрей П.',
                total: '₽1 900',
                items: '1 гортензия, 3 пионовидные',
                delivery: 'Самовывоз',
                time: '13:00',
                tags: ['Нужно доплата'],
                action: 'Получить оплату',
            },
        ],
    },
    {
        status: 'Доставка/выдача',
        hint: 'В пути',
        orders: [
            {
                id: '#A-228',
                customer: 'Курьер Мария',
                total: '₽6 500',
                items: 'Бокс Premium, шар, открытка',
                delivery: 'Доставка',
                time: '13:20',
                tags: ['Online', 'Чек отправлен'],
                action: 'Подтвердить вручение',
            },
            {
                id: '#A-226',
                customer: 'Клиент на месте',
                total: '₽1 200',
                items: 'Гиацинт ×5, крафт',
                delivery: 'Самовывоз',
                time: 'Сейчас',
                tags: ['Оплата картой'],
                action: 'Закрыть заказ',
            },
        ],
    },
];

const clients = [
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
];

const lowStock = [
    { name: 'Роза Freedom 60 см', details: 'Остаток по партии #304 · срез 09.02', left: '38 шт' },
    { name: 'Упаковка «Крафт»', details: 'FIFO: партия #118', left: '14 шт' },
    { name: 'Лента бордо', details: 'Партия #77 · рекомендовано пополнить', left: '9 м' },
];

const expiring = [
    { name: 'Гиацинт белый', details: 'Партия #289 · истекает сегодня', left: '26 шт', critical: true },
    { name: 'Хризантема кустовая', details: 'Партия #271 · истекает завтра', left: '34 шт', critical: false },
    { name: 'Эвкалипт', details: 'Партия #252 · 2 дня до списания', left: '18 шт', critical: false },
];

const autoWriteOff = {
    order: 'A-236',
    components: [
        { name: 'Тюльпан микс', qty: '15 шт · партия #101', batch: 'Срез 08.02 · осталось 42' },
        { name: 'Зелень рускус', qty: '6 шт · партия #198', batch: 'Срез 10.02 · осталось 23' },
        { name: 'Упаковка матовая', qty: '1 шт · партия #120', batch: 'Поступление 07.02 · осталось 17' },
    ],
};

const shiftWindow = 'Открыта в 09:00 · ответственный: Полина';

const shiftMetrics = [
    { label: 'Наличные', value: '₽32 800' },
    { label: 'Безнал / онлайн', value: '₽149 500' },
    { label: 'Возвраты', value: '₽3 200' },
    { label: 'Сдача в кассе', value: '₽4 000' },
];

const payments = [
    { title: 'Оплата заказа #A-235', note: 'Карта · чек отправлен', amount: '₽3 100' },
    { title: 'Приход партии #304', note: 'Закупка через кассу', amount: '₽18 600' },
    { title: 'Возврат #A-219', note: 'Наличные · оформлен', amount: '₽1 200' },
];

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
