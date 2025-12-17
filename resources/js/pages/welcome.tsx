import { Icon } from '@/components/icon';
import { dashboard, login, register } from '@/routes';
import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    BarChart3,
    Boxes,
    Clock3,
    CreditCard,
    Leaf,
    Sparkles,
    Smartphone,
} from 'lucide-react';

const pillars = [
    {
        title: 'Заказы за 60 секунд',
        icon: Clock3,
        description:
            'Поиск клиента по телефону, выбор доставки, добавление товаров и букетов, оплата любыми способами и чек — в пару касаний.',
        points: [
            'Статусы: Новый → В работе → Готов → Выдан/Доставлен → Завершён/Отменён',
            'Быстрые пресеты (например, «11 роз»), таймеры и напоминания',
            'Предзаказы и самовывоз с адресами и окнами доставки',
        ],
    },
    {
        title: 'Склад с партиями',
        icon: Boxes,
        description:
            'Учёт по штукам и метрам, приход партиями, списание по FIFO, инвентаризация и корректировки без таблиц в Excel.',
        points: [
            'Партии с датой поступления и сроком годности',
            'Списание по рецептам букетов автоматически при закрытии заказа',
            'Яркие индикаторы свежести и остатка для мобайла',
        ],
    },
    {
        title: 'Касса и смены',
        icon: CreditCard,
        description:
            'Оплаты наличными, картой, переводом или миксом; возвраты и долги фиксируются отдельными движениями.',
        points: [
            'Открытие и закрытие смен с контролем кассы',
            'Разделение платежей и скидок на позиции',
            'Печать чеков или отправка в мессенджер',
        ],
    },
    {
        title: 'Отчёты без Excel',
        icon: BarChart3,
        description:
            'Дневной дашборд по выручке, себестоимости и марже, плюс топ списаний и просрочка партий.',
        points: [
            'Фильтры по дате, статусу оплаты и доставке',
            'Сводка по методам оплаты и возвратам',
            'Сигналы о просрочке и отрицательных остатках',
        ],
    },
];

const quickActions = [
    {
        label: 'Мобайл: нижняя навигация',
        icon: Smartphone,
        items: ['Заказы', 'Касса', 'Склад', 'Клиенты', 'Ещё'],
    },
    {
        label: 'ПК: левое меню',
        icon: ArrowRight,
        items: ['Заказы', 'Склад', 'Товары', 'Сборки', 'Клиенты', 'Отчёты', 'Настройки'],
    },
    {
        label: 'Быстрые действия',
        icon: Sparkles,
        items: ['Создать заказ', 'Приход партии', 'Инвентаризация', 'Закрыть смену'],
    },
];

const flows = [
    {
        title: 'Создать заказ ≤ 60 секунд',
        items: [
            'Поиск/создание клиента по телефону',
            'Тип доставки: продажа, доставка, самовывоз или предзаказ',
            'Товары и букеты с подсказкой себестоимости',
            'Скидка, оплата (нал/карта/перевод/смешанная) и чек',
        ],
    },
    {
        title: 'Склад и списание',
        items: [
            'Приход: партии с закупочной ценой и сроком годности',
            'Списание по FIFO и автосписание рецептов при закрытии заказа',
            'Инвентаризация: движение adjust на разницу по партиям',
        ],
    },
    {
        title: 'Касса и смены',
        items: [
            'Открытие/закрытие смены с фиксацией кассы',
            'Возвраты и долги оформляются отдельными движениями оплаты',
            'Отчёты по оплатам и методам за день/неделю/месяц',
        ],
    },
];

const seo = {
    title: 'Gulalem Business — CRM для цветочного магазина',
    description:
        'PWA, склад по партиям и касса в одном интерфейсе. Принимайте заказы за 2–3 действия, списывайте по FIFO и контролируйте маржу без Excel.',
    url: '/',
    image: '/logo.svg',
};

const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Gulalem Business',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    url: seo.url,
    image: seo.image,
    description: seo.description,
    offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'RUB',
    },
    featureList: pillars.map((pillar) => pillar.title),
};

export default function Welcome({
    canRegister = true,
}: {
    canRegister?: boolean;
}) {
    const { auth } = usePage<SharedData>().props;

    return (
        <>
            <Head title={seo.title}>
                <meta name="description" content={seo.description} />
                <meta name="application-name" content="Gulalem Business" />
                <meta name="keywords" content="CRM, цветочный бизнес, склад, касса, PWA" />
                <meta property="og:type" content="website" />
                <meta property="og:title" content={seo.title} />
                <meta property="og:description" content={seo.description} />
                <meta property="og:url" content={seo.url} />
                <meta property="og:site_name" content="Gulalem Business" />
                <meta property="og:image" content={seo.image} />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content={seo.title} />
                <meta name="twitter:description" content={seo.description} />
                <link rel="canonical" href={seo.url} />
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link
                    href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600,700"
                    rel="stylesheet"
                />
                <script type="application/ld+json">
                    {JSON.stringify(jsonLd)}
                </script>
            </Head>

            <div className="relative min-h-screen bg-gradient-to-b from-white via-[#fdf6f0] to-white text-neutral-900 dark:from-[#0e0b08] dark:via-[#0f0b08] dark:to-[#0c0a08]">
                <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,rgba(255,115,92,0.12),transparent_35%),radial-gradient(circle_at_80%_10%,rgba(255,175,92,0.08),transparent_35%),radial-gradient(circle_at_50%_80%,rgba(111,91,255,0.06),transparent_30%)]" />

                <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-6 lg:px-8">
                    <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-900 text-white shadow-lg shadow-orange-500/30 ring-1 ring-neutral-900/10 dark:bg-white dark:text-neutral-900 dark:ring-white/15">
                            <Icon iconNode={Leaf} className="h-5 w-5" />
                        </span>
                        <div>
                            <p className="text-sm font-semibold uppercase tracking-[0.08em] text-orange-700 dark:text-orange-200">
                                Gulalem Business
                            </p>
                            <p className="text-sm text-neutral-600 dark:text-neutral-300">
                                CRM + склад для цветочного магазина
                            </p>
                        </div>
                    </div>

                    <nav className="flex items-center gap-3 text-sm font-medium">
                        {auth.user ? (
                            <Link
                                href={dashboard()}
                                className="flex items-center gap-2 rounded-full border border-orange-200/80 bg-white px-4 py-2 text-neutral-900 shadow-sm shadow-orange-200/60 transition hover:-translate-y-0.5 hover:shadow-lg dark:border-neutral-700/70 dark:bg-neutral-900 dark:text-white dark:shadow-none"
                            >
                                В кабинет
                                <Icon iconNode={ArrowRight} className="h-4 w-4" />
                            </Link>
                        ) : (
                            <>
                                <Link
                                    href={login()}
                                    className="rounded-full px-4 py-2 text-neutral-800 transition hover:text-orange-700 dark:text-neutral-200 dark:hover:text-orange-200"
                                >
                                    Войти
                                </Link>
                                {canRegister && (
                                    <Link
                                        href={register()}
                                        className="flex items-center gap-2 rounded-full border border-orange-200/80 bg-white px-4 py-2 text-neutral-900 shadow-sm shadow-orange-200/60 transition hover:-translate-y-0.5 hover:shadow-lg dark:border-neutral-700/70 dark:bg-neutral-900 dark:text-white dark:shadow-none"
                                    >
                                        Зарегистрироваться
                                        <Icon iconNode={Sparkles} className="h-4 w-4" />
                                    </Link>
                                )}
                            </>
                        )}
                    </nav>
                </header>

                <main className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-5 pb-16 lg:px-8 lg:pb-24">
                    <section className="grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-center">
                        <div className="space-y-6">
                            <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-orange-700 shadow-sm ring-1 ring-orange-100/80 backdrop-blur dark:bg-neutral-900/70 dark:text-orange-200 dark:ring-neutral-700">
                                PWA • мобайл и ПК • учёт по партиям
                            </div>
                            <div className="space-y-3">
                                <h1 className="text-3xl font-semibold leading-tight text-neutral-950 dark:text-white lg:text-4xl">
                                    Принимайте заказы за 2–3 действия, держите склад под контролем и считайте маржу без Excel.
                                </h1>
                                <p className="text-lg text-neutral-700 dark:text-neutral-300">
                                    Один фронт для продавца и владельца: мобильная нижняя навигация для смены, левое меню на ПК для управления.
                                </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                                <Link
                                    href={auth.user ? dashboard() : register()}
                                    className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-600 to-orange-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-200/50 transition hover:-translate-y-0.5 hover:shadow-xl"
                                >
                                    {auth.user ? 'Открыть дашборд' : 'Попробовать бесплатно'}
                                    <Icon iconNode={ArrowRight} className="h-4 w-4 transition group-hover:translate-x-0.5" />
                                </Link>
                                {!auth.user && (
                                    <Link
                                        href={login()}
                                        className="inline-flex items-center gap-2 rounded-full border border-orange-200/80 bg-white px-5 py-3 text-sm font-semibold text-neutral-900 shadow-sm shadow-orange-200/60 transition hover:-translate-y-0.5 hover:shadow-lg dark:border-neutral-700/70 dark:bg-neutral-900 dark:text-white"
                                    >
                                        Уже есть аккаунт
                                    </Link>
                                )}
                            </div>
                            <div className="grid gap-3 sm:grid-cols-3">
                                {[{ label: 'Время принятия заказа', value: '≤ 60 сек.' }, { label: 'Учёт остатков', value: 'Партии + FIFO' }, { label: 'Сценарии', value: 'Онлайн + офлайн' }].map((item) => (
                                    <div
                                        key={item.label}
                                        className="rounded-2xl border border-orange-100/70 bg-white/70 px-4 py-3 shadow-sm shadow-orange-200/40 backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/80 dark:shadow-none"
                                    >
                                        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-orange-700 dark:text-orange-200">
                                            {item.label}
                                        </p>
                                        <p className="text-lg font-semibold text-neutral-950 dark:text-white">{item.value}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="relative">
                            <div className="absolute inset-0 blur-[60px]" aria-hidden>
                                <div className="mx-auto h-full w-full rounded-3xl bg-gradient-to-br from-orange-200/40 via-orange-100/30 to-purple-200/20" />
                            </div>
                            <div className="relative grid gap-4 rounded-3xl border border-orange-100/70 bg-white/80 p-6 shadow-[0_20px_60px_-32px_rgba(0,0,0,0.3)] backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/80">
                                <div className="flex items-center justify-between rounded-2xl border border-orange-100/80 bg-gradient-to-r from-orange-50 to-white px-4 py-3 shadow-inner shadow-orange-100/60 dark:border-neutral-800 dark:from-neutral-800 dark:to-neutral-900">
                                    <div>
                                        <p className="text-xs font-semibold text-orange-700 dark:text-orange-200">Онлайн и офлайн</p>
                                        <p className="text-sm text-neutral-700 dark:text-neutral-200">PWA для продавцов, ПК-доступ для владельца</p>
                                    </div>
                                    <Icon iconNode={Smartphone} className="h-6 w-6 text-orange-600 dark:text-orange-200" />
                                </div>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="rounded-2xl border border-orange-100/80 bg-white/80 p-4 shadow-sm shadow-orange-200/60 dark:border-neutral-800 dark:bg-neutral-800/80">
                                        <div className="flex items-center gap-2">
                                            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-100">
                                                <Icon iconNode={Clock3} className="h-4 w-4" />
                                            </span>
                                            <div>
                                                <p className="text-xs font-semibold text-orange-700 dark:text-orange-200">Смена</p>
                                                <p className="text-sm font-semibold text-neutral-900 dark:text-white">Открыта · 09:00–21:00</p>
                                            </div>
                                        </div>
                                        <ul className="mt-3 space-y-2 text-sm text-neutral-700 dark:text-neutral-200">
                                            <li>· Касса: 52 300 ₽</li>
                                            <li>· Онлайн: 18 700 ₽</li>
                                            <li>· Возвраты: 0 ₽</li>
                                        </ul>
                                    </div>
                                    <div className="rounded-2xl border border-orange-100/80 bg-white/80 p-4 shadow-sm shadow-orange-200/60 dark:border-neutral-800 dark:bg-neutral-800/80">
                                        <div className="flex items-center gap-2">
                                            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-100">
                                                <Icon iconNode={Boxes} className="h-4 w-4" />
                                            </span>
                                            <div>
                                                <p className="text-xs font-semibold text-orange-700 dark:text-orange-200">Склад</p>
                                                <p className="text-sm font-semibold text-neutral-900 dark:text-white">Остатки по партиям</p>
                                            </div>
                                        </div>
                                        <ul className="mt-3 space-y-2 text-sm text-neutral-700 dark:text-neutral-200">
                                            <li>· Розы 70 см — 84 шт (свежие)</li>
                                            <li>· Эвкалипт — 36 шт (до 3 дней)</li>
                                            <li>· Ленты/упаковка — 124 м/шт</li>
                                        </ul>
                                    </div>
                                </div>
                                <div className="rounded-2xl border border-orange-100/80 bg-white/90 p-4 shadow-sm shadow-orange-200/60 dark:border-neutral-800 dark:bg-neutral-800/80">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs font-semibold text-orange-700 dark:text-orange-200">Дневной отчёт</p>
                                            <p className="text-xl font-semibold text-neutral-950 dark:text-white">Выручка 71 000 ₽ · Маржа 43%</p>
                                        </div>
                                        <Icon iconNode={BarChart3} className="h-5 w-5 text-orange-600 dark:text-orange-200" />
                                    </div>
                                    <div className="mt-3 grid gap-2 sm:grid-cols-3">
                                        <div className="rounded-xl border border-orange-100/80 bg-white/80 px-3 py-2 text-sm font-semibold text-neutral-900 shadow-inner shadow-orange-100/70 dark:border-neutral-700 dark:bg-neutral-900">Оплаты · карта 54%</div>
                                        <div className="rounded-xl border border-orange-100/80 bg-white/80 px-3 py-2 text-sm font-semibold text-neutral-900 shadow-inner shadow-orange-100/70 dark:border-neutral-700 dark:bg-neutral-900">FIFO списано 126 позиций</div>
                                        <div className="rounded-xl border border-orange-100/80 bg-white/80 px-3 py-2 text-sm font-semibold text-neutral-900 shadow-inner shadow-orange-100/70 dark:border-neutral-700 dark:bg-neutral-900">Просрочка 0 партий</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="space-y-6">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-orange-700 dark:text-orange-200">
                                    Модули
                                </p>
                                <h2 className="text-2xl font-semibold text-neutral-950 dark:text-white">Всё, что нужно цветочному бизнесу</h2>
                                <p className="text-neutral-700 dark:text-neutral-300">
                                    CRM, склад, касса и отчёты на единой PWA-платформе. Управляйте сменой, контролируйте FIFO-списание и маржу без сложных онбордингов.
                                </p>
                            </div>
                            <Link
                                href={auth.user ? dashboard() : register()}
                                className="hidden items-center gap-2 rounded-full border border-orange-200/80 bg-white px-4 py-2 text-sm font-semibold text-neutral-900 shadow-sm shadow-orange-200/60 transition hover:-translate-y-0.5 hover:shadow-lg dark:border-neutral-700/70 dark:bg-neutral-900 dark:text-white lg:inline-flex"
                            >
                                {auth.user ? 'Перейти в работу' : 'Создать аккаунт'}
                                <Icon iconNode={ArrowRight} className="h-4 w-4" />
                            </Link>
                        </div>
                        <div className="grid gap-6 lg:grid-cols-2">
                            {pillars.map((pillar) => (
                                <div
                                    key={pillar.title}
                                    className="flex h-full flex-col gap-4 rounded-3xl border border-orange-100/80 bg-white/80 p-6 shadow-sm shadow-orange-200/60 backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/80"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-100">
                                            <Icon iconNode={pillar.icon} className="h-5 w-5" />
                                        </span>
                                        <div>
                                            <h3 className="text-lg font-semibold text-neutral-950 dark:text-white">{pillar.title}</h3>
                                            <p className="text-sm text-neutral-700 dark:text-neutral-300">{pillar.description}</p>
                                        </div>
                                    </div>
                                    <ul className="space-y-2 text-sm text-neutral-800 dark:text-neutral-200">
                                        {pillar.points.map((point) => (
                                            <li key={point} className="flex items-start gap-2">
                                                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-orange-500" />
                                                <span>{point}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="space-y-6 rounded-3xl border border-orange-100/80 bg-white/80 p-6 shadow-sm shadow-orange-200/60 backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/80">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-orange-700 dark:text-orange-200">Опыт продавца и владельца</p>
                                <h2 className="text-2xl font-semibold text-neutral-950 dark:text-white">Навигация и быстрые сценарии</h2>
                                <p className="text-neutral-700 dark:text-neutral-300">Продуманный интерфейс: нижнее меню для мобайла, боковое — для ПК. Частые операции вынесены в быстрые действия.</p>
                            </div>
                        </div>
                        <div className="grid gap-4 md:grid-cols-3">
                            {quickActions.map((section) => (
                                <div key={section.label} className="flex flex-col gap-3 rounded-2xl border border-orange-100/80 bg-white/90 p-4 shadow-inner shadow-orange-100/60 dark:border-neutral-800 dark:bg-neutral-800/80">
                                    <div className="flex items-center gap-2 text-sm font-semibold text-neutral-900 dark:text-white">
                                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-100">
                                            <Icon iconNode={section.icon} className="h-4 w-4" />
                                        </span>
                                        {section.label}
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {section.items.map((item) => (
                                            <span
                                                key={item}
                                                className="rounded-full border border-orange-100/80 bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-800 shadow-sm shadow-orange-100/60 dark:border-neutral-700 dark:bg-neutral-900 dark:text-orange-100"
                                            >
                                                {item}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="space-y-6">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-orange-700 dark:text-orange-200">MVP-потоки</p>
                            <h2 className="text-2xl font-semibold text-neutral-950 dark:text-white">Реальные сценарии первой версии</h2>
                            <p className="text-neutral-700 dark:text-neutral-300">Все ключевые цепочки из технического плана: быстрый заказ, складские операции и смена в кассе.</p>
                        </div>
                        <div className="grid gap-4 lg:grid-cols-3">
                            {flows.map((flow) => (
                                <div key={flow.title} className="flex h-full flex-col gap-3 rounded-2xl border border-orange-100/80 bg-white/90 p-5 shadow-sm shadow-orange-200/60 backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/80">
                                    <div className="flex items-start gap-3">
                                        <span className="mt-1 flex h-9 w-9 items-center justify-center rounded-xl bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-100">
                                            <Icon iconNode={ArrowRight} className="h-4 w-4" />
                                        </span>
                                        <div>
                                            <h3 className="text-lg font-semibold text-neutral-950 dark:text-white">{flow.title}</h3>
                                            <ul className="mt-2 space-y-2 text-sm text-neutral-800 dark:text-neutral-200">
                                                {flow.items.map((item) => (
                                                    <li key={item} className="flex items-start gap-2">
                                                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-orange-500" />
                                                        <span>{item}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </main>

                <footer className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-5 pb-10 pt-6 text-sm text-neutral-600 lg:px-8 dark:text-neutral-400">
                    <div className="flex flex-wrap items-center gap-3">
                        <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-orange-700 shadow-sm shadow-orange-100/70 ring-1 ring-orange-100/60 dark:bg-neutral-900/70 dark:text-orange-200 dark:ring-neutral-800">
                            Laravel + React + Tailwind · PWA
                        </span>
                        <span className="text-xs text-neutral-500 dark:text-neutral-400">Сделано для цветочных магазинов, где важна скорость и контроль склада.</span>
                    </div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-500">Gulalem Business · 2025</p>
                </footer>
            </div>
        </>
    );
}
