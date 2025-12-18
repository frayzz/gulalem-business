import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import type { PageProps } from '@inertiajs/shared';
import { Leaf } from 'lucide-react';
import { FormEvent } from 'react';

interface InventoryPageProps extends PageProps {
    batches: {
        data: BatchResource[];
        links: { url: string | null; label: string; active: boolean }[];
    };
    recipes: RecipeResource[];
}

interface BatchResource {
    id: number;
    product?: { name: string } | null;
    qty_left: string;
    expires_at?: string | null;
    arrived_at?: string | null;
}

interface RecipeResource {
    id: number;
    bouquet?: { name: string } | null;
    items: {
        id: number;
        qty: string;
        product?: { name: string } | null;
    }[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Склад', href: '/inventory' },
];

function formatDate(value?: string | null) {
    if (!value) return '—';
    return new Date(value).toLocaleDateString('ru-RU');
}

export default function InventoryIndex({ batches, recipes, auth }: InventoryPageProps) {
    const batchForm = useForm({
        product_name: '',
        quantity: '',
        arrived_at: '',
        expires_at: '',
    });

    const recipeForm = useForm({
        bouquet_name: '',
        components: [
            {
                product_name: '',
                qty: '',
            },
        ],
    });

    const submitBatch = (event: FormEvent) => {
        event.preventDefault();
        batchForm.post('/inventory', {
            onSuccess: () => batchForm.reset(),
        });
    };

    const addComponentRow = () => {
        recipeForm.setData('components', [
            ...recipeForm.data.components,
            { product_name: '', qty: '' },
        ]);
    };

    const updateComponent = (index: number, field: 'product_name' | 'qty', value: string) => {
        const nextComponents = recipeForm.data.components.map((component, idx) =>
            idx === index ? { ...component, [field]: value } : component,
        );

        recipeForm.setData('components', nextComponents);
    };

    const submitRecipe = (event: FormEvent) => {
        event.preventDefault();
        recipeForm.post('/inventory/recipes', {
            onSuccess: () =>
                recipeForm.reset('bouquet_name', 'components') ||
                recipeForm.setData('components', [{ product_name: '', qty: '' }]),
        });
    };

    return (
        <AppLayout user={auth.user} breadcrumbs={breadcrumbs}>
            <Head title="Склад" />

            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-semibold">Склад</h1>
                    <p className="text-sm text-muted-foreground">
                        Активные партии по FIFO и контроль срока годности
                    </p>
                </div>

                <Card className="border-border/80">
                    <CardHeader>
                        <CardTitle>Быстрое поступление</CardTitle>
                        <CardDescription>Добавьте партию — она сразу попадёт в список</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form className="grid gap-4 md:grid-cols-2" onSubmit={submitBatch}>
                            <div className="space-y-2">
                                <Label htmlFor="product_name">Товар</Label>
                                <Input
                                    id="product_name"
                                    value={batchForm.data.product_name}
                                    onChange={(event) => batchForm.setData('product_name', event.target.value)}
                                    placeholder="Роза, тюльпан и т.д."
                                    required
                                />
                                {batchForm.errors.product_name && (
                                    <p className="text-xs text-destructive">{batchForm.errors.product_name}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="quantity">Количество</Label>
                                <Input
                                    id="quantity"
                                    type="number"
                                    min={1}
                                    value={batchForm.data.quantity}
                                    onChange={(event) => batchForm.setData('quantity', event.target.value)}
                                    required
                                />
                                {batchForm.errors.quantity && (
                                    <p className="text-xs text-destructive">{batchForm.errors.quantity}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="arrived_at">Дата поступления</Label>
                                <Input
                                    id="arrived_at"
                                    type="date"
                                    value={batchForm.data.arrived_at}
                                    onChange={(event) => batchForm.setData('arrived_at', event.target.value)}
                                />
                                {batchForm.errors.arrived_at && (
                                    <p className="text-xs text-destructive">{batchForm.errors.arrived_at}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="expires_at">Срок годности</Label>
                                <Input
                                    id="expires_at"
                                    type="date"
                                    value={batchForm.data.expires_at}
                                    onChange={(event) => batchForm.setData('expires_at', event.target.value)}
                                />
                                {batchForm.errors.expires_at && (
                                    <p className="text-xs text-destructive">{batchForm.errors.expires_at}</p>
                                )}
                            </div>
                            <div className="md:col-span-2">
                                <button
                                    type="submit"
                                    className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
                                    disabled={batchForm.processing}
                                >
                                    Добавить партию
                                </button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                <Card className="border-border/80">
                    <CardHeader>
                        <CardTitle>Рецепты букетов</CardTitle>
                        <CardDescription>Определите состав — касса спишет его при оплате</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <form className="space-y-4" onSubmit={submitRecipe}>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="bouquet_name">Название букета</Label>
                                    <Input
                                        id="bouquet_name"
                                        value={recipeForm.data.bouquet_name}
                                        onChange={(event) => recipeForm.setData('bouquet_name', event.target.value)}
                                        placeholder="Например, 'Красная классика'"
                                        required
                                    />
                                    {recipeForm.errors.bouquet_name && (
                                        <p className="text-xs text-destructive">{recipeForm.errors.bouquet_name}</p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label>Компоненты</Label>
                                    <button
                                        type="button"
                                        onClick={addComponentRow}
                                        className="text-sm text-primary hover:underline"
                                    >
                                        + Добавить
                                    </button>
                                </div>

                                {recipeForm.data.components.map((component, index) => (
                                    <div key={index} className="grid gap-3 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Input
                                                placeholder="Роза"
                                                value={component.product_name}
                                                onChange={(event) =>
                                                    updateComponent(index, 'product_name', event.target.value)
                                                }
                                                required
                                            />
                                            {recipeForm.errors[`components.${index}.product_name` as keyof typeof recipeForm.errors] && (
                                                <p className="text-xs text-destructive">
                                                    {
                                                        recipeForm.errors[
                                                            `components.${index}.product_name` as keyof typeof recipeForm.errors
                                                        ] as string
                                                    }
                                                </p>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <Input
                                                type="number"
                                                min={0.1}
                                                step={0.1}
                                                placeholder="3"
                                                value={component.qty}
                                                onChange={(event) => updateComponent(index, 'qty', event.target.value)}
                                                required
                                            />
                                            {recipeForm.errors[`components.${index}.qty` as keyof typeof recipeForm.errors] && (
                                                <p className="text-xs text-destructive">
                                                    {
                                                        recipeForm.errors[
                                                            `components.${index}.qty` as keyof typeof recipeForm.errors
                                                        ] as string
                                                    }
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div>
                                <button
                                    type="submit"
                                    className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
                                    disabled={recipeForm.processing}
                                >
                                    Сохранить рецепт
                                </button>
                            </div>
                        </form>

                        <div className="space-y-3">
                            <Label>Существующие рецепты</Label>
                            {recipes.length === 0 && (
                                <p className="text-sm text-muted-foreground">Рецепты пока не заданы.</p>
                            )}
                            {recipes.map((recipe) => (
                                <div key={recipe.id} className="rounded-lg border bg-muted/40 p-3">
                                    <div className="mb-2 flex items-center justify-between">
                                        <p className="font-semibold">{recipe.bouquet?.name ?? 'Без названия'}</p>
                                        <Badge variant="outline">{recipe.items.length} поз.</Badge>
                                    </div>
                                    <ul className="space-y-1 text-sm text-muted-foreground">
                                        {recipe.items.map((item) => (
                                            <li key={item.id}>
                                                {item.product?.name ?? '—'} — {Number(item.qty)} шт.
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Партии товаров</CardTitle>
                        <CardDescription>Отсортированы по сроку годности и дате поступления</CardDescription>
                    </CardHeader>
                    <CardContent className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>ID</TableHead>
                                    <TableHead>Товар</TableHead>
                                    <TableHead>Остаток</TableHead>
                                    <TableHead>Поступление</TableHead>
                                    <TableHead>Срок годности</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {batches.data.map((batch) => (
                                    <TableRow key={batch.id}>
                                        <TableCell className="font-medium">#{batch.id}</TableCell>
                                        <TableCell className="flex items-center gap-2">
                                            <Leaf className="h-4 w-4 text-muted-foreground" />
                                            {batch.product?.name ?? 'Без названия'}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary">{Number(batch.qty_left)}</Badge>
                                        </TableCell>
                                        <TableCell>{formatDate(batch.arrived_at)}</TableCell>
                                        <TableCell>{formatDate(batch.expires_at)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>

                        <div className="mt-4 flex flex-wrap gap-2 text-sm">
                            {batches.links
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
