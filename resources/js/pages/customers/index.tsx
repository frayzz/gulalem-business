import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import type { PageProps } from '@inertiajs/shared';
import { Mail, Phone, UserPlus } from 'lucide-react';
import { FormEvent } from 'react';

interface CustomersPageProps extends PageProps {
    customers: {
        data: CustomerResource[];
        links: { url: string | null; label: string; active: boolean }[];
    };
}

interface CustomerResource {
    id: number;
    name?: string | null;
    phone?: string | null;
    email?: string | null;
    birthday?: string | null;
    notes?: string | null;
    orders_count: number;
    created_at: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Клиенты', href: '/customers' },
];

export default function CustomersIndex({ customers, auth }: CustomersPageProps) {
    const customerForm = useForm({
        name: '',
        phone: '',
        email: '',
        birthday: '',
        notes: '',
    });

    const createCustomer = (event: FormEvent) => {
        event.preventDefault();
        customerForm.post('/customers', {
            onSuccess: () => customerForm.reset(),
        });
    };

    return (
        <AppLayout user={auth.user} breadcrumbs={breadcrumbs}>
            <Head title="Клиенты" />

            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-semibold">Клиенты</h1>
                    <p className="text-sm text-muted-foreground">
                        База с контактами, датами рождения и заметками по заказам
                    </p>
                </div>

                <Card className="border-border/80">
                    <CardHeader>
                        <CardTitle>Быстро добавить клиента</CardTitle>
                        <CardDescription>Контакт сразу появится в списке и может быть привязан к заказу</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form className="space-y-4" onSubmit={createCustomer}>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Имя</Label>
                                    <Input
                                        id="name"
                                        value={customerForm.data.name}
                                        onChange={(event) => customerForm.setData('name', event.target.value)}
                                        placeholder="Например, Анна"
                                    />
                                    {customerForm.errors.name && (
                                        <p className="text-xs text-destructive">{customerForm.errors.name}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Телефон</Label>
                                    <Input
                                        id="phone"
                                        value={customerForm.data.phone}
                                        onChange={(event) => customerForm.setData('phone', event.target.value)}
                                        placeholder="+7 (999) 123-45-67"
                                    />
                                    {customerForm.errors.phone && (
                                        <p className="text-xs text-destructive">{customerForm.errors.phone}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={customerForm.data.email}
                                        onChange={(event) => customerForm.setData('email', event.target.value)}
                                        placeholder="client@example.com"
                                    />
                                    {customerForm.errors.email && (
                                        <p className="text-xs text-destructive">{customerForm.errors.email}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="birthday">День рождения</Label>
                                    <Input
                                        id="birthday"
                                        type="date"
                                        value={customerForm.data.birthday}
                                        onChange={(event) => customerForm.setData('birthday', event.target.value)}
                                    />
                                    {customerForm.errors.birthday && (
                                        <p className="text-xs text-destructive">{customerForm.errors.birthday}</p>
                                    )}
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="notes">Заметки</Label>
                                    <textarea
                                        id="notes"
                                        className="min-h-[80px] w-full rounded-md border px-3 py-2 text-sm"
                                        value={customerForm.data.notes}
                                        onChange={(event) => customerForm.setData('notes', event.target.value)}
                                        placeholder="Предпочтения, важные детали по доставке или оплате"
                                    />
                                    {customerForm.errors.notes && (
                                        <p className="text-xs text-destructive">{customerForm.errors.notes}</p>
                                    )}
                                </div>
                            </div>

                            <Button type="submit" disabled={customerForm.processing}>
                                <UserPlus className="mr-2 h-4 w-4" />Сохранить
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Клиентская база</CardTitle>
                            <CardDescription>Все клиенты с историей заказов</CardDescription>
                        </div>
                        <Badge variant="outline">{customers.data.length} записей</Badge>
                    </CardHeader>
                    <CardContent className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>ID</TableHead>
                                    <TableHead>Имя</TableHead>
                                    <TableHead>Контакты</TableHead>
                                    <TableHead>День рождения</TableHead>
                                    <TableHead>Заказы</TableHead>
                                    <TableHead>Создан</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {customers.data.map((customer) => (
                                    <TableRow key={customer.id}>
                                        <TableCell className="font-medium">#{customer.id}</TableCell>
                                        <TableCell>{customer.name ?? 'Без имени'}</TableCell>
                                        <TableCell className="space-y-1 text-sm text-muted-foreground">
                                            {customer.phone && (
                                                <div className="flex items-center gap-2">
                                                    <Phone className="h-4 w-4" />
                                                    <span>{customer.phone}</span>
                                                </div>
                                            )}
                                            {customer.email && (
                                                <div className="flex items-center gap-2">
                                                    <Mail className="h-4 w-4" />
                                                    <span>{customer.email}</span>
                                                </div>
                                            )}
                                            {!customer.phone && !customer.email && <span>—</span>}
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {customer.birthday
                                                ? new Date(customer.birthday).toLocaleDateString('ru-RU')
                                                : '—'}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary">{customer.orders_count}</Badge>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {new Date(customer.created_at).toLocaleDateString('ru-RU')}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>

                        <div className="mt-4 flex flex-wrap gap-2 text-sm">
                            {customers.links
                                .filter((link) => link.url)
                                .map((link, index) => (
                                    <a
                                        key={`${link.label}-${index}`}
                                        href={link.url as string}
                                        className={`rounded-md border px-3 py-1 ${link.active ? 'bg-primary text-primary-foreground' : ''}`}
                                    >
                                        {link.label.replace('&laquo; Previous', '‹').replace('Next &raquo;', '›')}
                                    </a>
                                ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
