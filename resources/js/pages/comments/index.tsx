import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import type { PageProps } from '@inertiajs/shared';
import { MessageSquare } from 'lucide-react';

interface CommentsPageProps extends PageProps {
    comments: {
        data: CommentResource[];
        links: { url: string | null; label: string; active: boolean }[];
    };
}

interface CommentResource {
    id: number;
    customer?: { name: string | null } | null;
    notes?: string | null;
    created_at: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Комменты', href: '/comments' },
];

export default function CommentsIndex({ comments, auth }: CommentsPageProps) {
    return (
        <AppLayout user={auth.user} breadcrumbs={breadcrumbs}>
            <Head title="Комменты" />

            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-semibold">Комменты</h1>
                    <p className="text-sm text-muted-foreground">
                        Замечания и пожелания клиентов из заказов
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Последние сообщения</CardTitle>
                        <CardDescription>Берутся из поля «notes» в заказах</CardDescription>
                    </CardHeader>
                    <CardContent className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>ID заказа</TableHead>
                                    <TableHead>Клиент</TableHead>
                                    <TableHead>Комментарий</TableHead>
                                    <TableHead>Создано</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {comments.data.map((comment) => (
                                    <TableRow key={comment.id}>
                                        <TableCell className="font-medium">#{comment.id}</TableCell>
                                        <TableCell>{comment.customer?.name ?? 'Без имени'}</TableCell>
                                        <TableCell className="flex items-start gap-2">
                                            <MessageSquare className="mt-0.5 h-4 w-4 text-muted-foreground" />
                                            <span>{comment.notes}</span>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {new Date(comment.created_at).toLocaleString('ru-RU')}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>

                        <div className="mt-4 flex flex-wrap gap-2 text-sm">
                            {comments.links
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
