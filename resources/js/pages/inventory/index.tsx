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
}

interface BatchResource {
    id: number;
    product?: { name: string } | null;
    qty_left: string;
    expires_at?: string | null;
    arrived_at?: string | null;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Склад', href: '/inventory' },
];

function formatDate(value?: string | null) {
    if (!value) return '—';
    return new Date(value).toLocaleDateString('ru-RU');
}

export default function InventoryIndex({ batches, auth }: InventoryPageProps) {
    const batchForm = useForm({
        product_name: '',
        quantity: '',
        arrived_at: '',
        expires_at: '',
    });

    const submitBatch = (event: FormEvent) => {
        event.preventDefault();
        batchForm.post('/inventory', {
            onSuccess: () => batchForm.reset(),
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
