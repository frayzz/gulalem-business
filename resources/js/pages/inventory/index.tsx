import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import type { PageProps } from '@inertiajs/shared';
import { Leaf, Plus, Scissors } from 'lucide-react';
import { FormEvent } from 'react';

interface InventoryPageProps extends PageProps {
    batches: {
        data: BatchResource[];
        links: { url: string | null; label: string; active: boolean }[];
    };
    recipes: RecipeResource[];
    products: ProductResource[];
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

interface ProductResource {
    id: number;
    name: string;
    unit: string;
    available_qty: number;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Склад', href: '/inventory' },
];

function formatDate(value?: string | null) {
    if (!value) return '—';
    return new Date(value).toLocaleDateString('ru-RU');
}

export default function InventoryIndex({ batches, recipes, products, auth }: InventoryPageProps) {
    const batchForm = useForm({
        product_name: '',
        product_price: '',
        buy_price: '',
        quantity: '',
        arrived_at: '',
        expires_at: '',
    });

    const recipeForm = useForm({
        bouquet_name: '',
        bouquet_price: '',
        items: [{ product_id: '', qty: '' }],
    });

    const submitBatch = (event: FormEvent) => {
        event.preventDefault();
        batchForm.post('/inventory', {
            onSuccess: () => batchForm.reset(),
        });
    };

    const submitRecipe = (event: FormEvent) => {
        event.preventDefault();
        recipeForm.post('/inventory/recipes', {
            preserveScroll: true,
            onSuccess: () => recipeForm.setData({ bouquet_name: '', bouquet_price: '', items: [{ product_id: '', qty: '' }] }),
        });
    };

    const addIngredient = () => {
        recipeForm.setData('items', [...recipeForm.data.items, { product_id: '', qty: '' }]);
    };

    const updateIngredient = (index: number, field: 'product_id' | 'qty', value: string) => {
        const next = [...recipeForm.data.items];
        next[index] = { ...next[index], [field]: value };
        recipeForm.setData('items', next);
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
                                <Label htmlFor="product_price">Цена продажи (за единицу)</Label>
                                <Input
                                    id="product_price"
                                    type="number"
                                    min={0}
                                    step="0.01"
                                    value={batchForm.data.product_price}
                                    onChange={(event) => batchForm.setData('product_price', event.target.value)}
                                    required
                                />
                                {batchForm.errors.product_price && (
                                    <p className="text-xs text-destructive">{batchForm.errors.product_price}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="buy_price">Закупочная цена (за единицу)</Label>
                                <Input
                                    id="buy_price"
                                    type="number"
                                    min={0}
                                    step="0.01"
                                    value={batchForm.data.buy_price}
                                    onChange={(event) => batchForm.setData('buy_price', event.target.value)}
                                    required
                                />
                                {batchForm.errors.buy_price && (
                                    <p className="text-xs text-destructive">{batchForm.errors.buy_price}</p>
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
                        <CardTitle>Рецепт букета</CardTitle>
                        <CardDescription>Опишите состав — он будет использоваться при сборке</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form className="space-y-4" onSubmit={submitRecipe}>
                            <div className="space-y-2">
                                <Label htmlFor="bouquet_name">Название букета</Label>
                                <Input
                                    id="bouquet_name"
                                    value={recipeForm.data.bouquet_name}
                                    onChange={(event) => recipeForm.setData('bouquet_name', event.target.value)}
                                    placeholder="Например, Роза 15 шт"
                                    required
                                />
                                {recipeForm.errors.bouquet_name && (
                                    <p className="text-xs text-destructive">{recipeForm.errors.bouquet_name}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="bouquet_price">Цена букета</Label>
                                <Input
                                    id="bouquet_price"
                                    type="number"
                                    min={0}
                                    step="0.01"
                                    value={recipeForm.data.bouquet_price}
                                    onChange={(event) => recipeForm.setData('bouquet_price', event.target.value)}
                                    required
                                />
                                {recipeForm.errors.bouquet_price && (
                                    <p className="text-xs text-destructive">{recipeForm.errors.bouquet_price}</p>
                                )}
                            </div>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Label>Компоненты</Label>
                                        <button
                                            type="button"
                                        className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                                        onClick={addIngredient}
                                    >
                                        <Plus className="h-4 w-4" /> Добавить
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {recipeForm.errors.items && (
                                        <p className="text-sm text-destructive">{recipeForm.errors.items}</p>
                                    )}

                                    {products.length === 0 && (
                                        <p className="text-sm text-muted-foreground">
                                            На складе нет товаров для добавления в рецепт.
                                        </p>
                                    )}

                                    {recipeForm.data.items.map((item, index) => {
                                        const selectedProduct = products.find(
                                            (product) => product.id === Number(item.product_id)
                                        );

                                        return (
                                            <div key={index} className="grid gap-3 rounded-md border p-3 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] md:items-end">
                                                <div className="space-y-2">
                                                    <Label htmlFor={`recipe_product_${index}`}>Товар / материал</Label>
                                                    <select
                                                        id={`recipe_product_${index}`}
                                                        className="w-full rounded-md border px-3 py-2 text-sm"
                                                        value={item.product_id}
                                                        onChange={(event) =>
                                                            updateIngredient(index, 'product_id', event.target.value)
                                                        }
                                                        required
                                                        disabled={!products.length}
                                                    >
                                                        <option value="">Выберите товар</option>
                                                        {products.map((product) => (
                                                            <option key={product.id} value={product.id}>
                                                                {product.name} · {product.available_qty} {product.unit}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    {recipeForm.errors[`items.${index}.product_id`] && (
                                                        <p className="text-xs text-destructive">
                                                            {recipeForm.errors[`items.${index}.product_id`]}
                                                        </p>
                                                    )}
                                                    {selectedProduct && (
                                                        <p className="text-xs text-muted-foreground">
                                                            Доступно на складе: {selectedProduct.available_qty} {selectedProduct.unit}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor={`recipe_qty_${index}`}>Количество</Label>
                                                    <Input
                                                        id={`recipe_qty_${index}`}
                                                        type="number"
                                                        min={0.001}
                                                        step="0.001"
                                                        value={item.qty}
                                                        onChange={(event) => updateIngredient(index, 'qty', event.target.value)}
                                                        required
                                                    />
                                                    {recipeForm.errors[`items.${index}.qty`] && (
                                                        <p className="text-xs text-destructive">
                                                            {recipeForm.errors[`items.${index}.qty`]}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
                                    disabled={recipeForm.processing}
                                >
                                    <Scissors className="mr-2 h-4 w-4" /> Сохранить рецепт
                                </button>
                            </div>
                        </form>
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

                <Card>
                    <CardHeader>
                        <CardTitle>Рецепты букетов</CardTitle>
                        <CardDescription>Список составов, используемых в заказах</CardDescription>
                    </CardHeader>
                    <CardContent className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>ID</TableHead>
                                    <TableHead>Букет</TableHead>
                                    <TableHead>Компоненты</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recipes.map((recipe) => (
                                    <TableRow key={recipe.id}>
                                        <TableCell>#{recipe.id}</TableCell>
                                        <TableCell className="font-medium">{recipe.bouquet?.name ?? 'Без названия'}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-2 text-sm">
                                                {recipe.items.map((item) => (
                                                    <Badge key={item.id} variant="secondary">
                                                        {item.product?.name ?? 'Неизвестно'} × {Number(item.qty)}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
