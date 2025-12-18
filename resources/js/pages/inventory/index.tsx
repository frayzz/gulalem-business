import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import type { PageProps } from '@inertiajs/shared';
import { Leaf } from 'lucide-react';

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
