import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, Search, Clock, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { DirectoryShop, DirectoryFilters, ConnectionStatus } from '@/types';
import { ConnectRequestDialog } from '@/components/directory/ConnectRequestDialog';
import { useToast } from '@/components/ui/use-toast';

export default function ShopDirectoryPage() {
  const [shops, setShops] = useState<DirectoryShop[]>([]);
  const [filters, setFilters] = useState<DirectoryFilters>({ categories: [], cities: [] });
  const [isLoading, setIsLoading] = useState(true);
  
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [city, setCity] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedShop, setSelectedShop] = useState<{ id: string; name: string } | null>(null);

  const { toast } = useToast();

  const fetchShops = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12'
      });
      if (search) params.append('search', search);
      if (category !== 'all') params.append('category', category);
      if (city !== 'all') params.append('city', city);

      const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/supplier-directory/shops?${params}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('supplierToken')}` }
      });

      if (response.data.success) {
        setShops(response.data.data.shops);
        setFilters(response.data.data.filters);
        setTotalPages(response.data.data.totalPages);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch directory',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchShops();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [search, category, city, page]);

  const handleConnectClick = (shop: DirectoryShop) => {
    setSelectedShop({ id: shop._id, name: shop.shopName || shop.name || 'Shop' });
    setDialogOpen(true);
  };

  const handleConnectSuccess = (newStatus: ConnectionStatus) => {
    if (selectedShop) {
      setShops(shops.map(s => 
        s._id === selectedShop.id ? { ...s, connectionStatus: newStatus } : s
      ));
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Find Shops</h1>
        <p className="text-muted-foreground mt-2">Connect with businesses looking for suppliers like you.</p>
      </div>

      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur py-4 border-b mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search shops..."
            className="pl-9"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <Select value={category} onValueChange={(val) => { setCategory(val); setPage(1); }}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {filters.categories?.map(c => (
              <SelectItem key={c.name} value={c.name}>{c.name} ({c.count})</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={city} onValueChange={(val) => { setCity(val); setPage(1); }}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Cities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Cities</SelectItem>
            {filters.cities?.map(c => (
              <SelectItem key={c.name} value={c.name}>{c.name} ({c.count})</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => (
            <Card key={i}>
              <CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader>
              <CardContent><Skeleton className="h-4 w-1/2 mb-2" /><Skeleton className="h-10 w-full" /></CardContent>
            </Card>
          ))}
        </div>
      ) : shops.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-xl text-muted-foreground">No shops found matching your filters</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {shops.map(shop => (
              <Card key={shop._id} className="flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl line-clamp-1">{shop.shopName || shop.name}</CardTitle>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground mt-1">
                    <MapPin className="h-3 w-3 mr-1" />
                    {shop.location?.city}, {shop.location?.state}
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  {shop.categoriesOfInterest && shop.categoriesOfInterest.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {shop.categoriesOfInterest.map(cat => (
                        <Badge key={cat} variant="secondary" className="text-xs">{cat}</Badge>
                      ))}
                    </div>
                  )}
                  <p className="text-sm text-muted-foreground mt-4">
                    Member since {new Date(shop.createdAt).getFullYear()}
                  </p>
                  <p className="text-sm font-medium mt-1">
                    {shop.totalConnectedSuppliers} suppliers connected
                  </p>
                </CardContent>
                <CardFooter>
                  {shop.connectionStatus === 'none' || shop.connectionStatus === 'disconnected' ? (
                    <Button className="w-full" onClick={() => handleConnectClick(shop)}>Connect</Button>
                  ) : shop.connectionStatus === 'pending_sent' ? (
                    <Button className="w-full" variant="secondary" disabled>
                      <Clock className="h-4 w-4 mr-2" /> Request Sent
                    </Button>
                  ) : shop.connectionStatus === 'pending_received' ? (
                    <Button className="w-full" variant="outline" asChild>
                      <Link to="/supplier/connections/pending">Respond to Request</Link>
                    </Button>
                  ) : shop.connectionStatus === 'connected' ? (
                    <div className="w-full text-center py-2 bg-green-50 text-green-700 rounded-md flex items-center justify-center border border-green-200">
                      <CheckCircle className="h-4 w-4 mr-2" /> Connected
                    </div>
                  ) : (
                    <Button className="w-full" variant="outline" onClick={() => handleConnectClick(shop)}>Reconnect</Button>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
          
          {totalPages > 1 && (
            <div className="flex justify-center mt-8 gap-2">
              <Button variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
              <div className="flex items-center px-4">Page {page} of {totalPages}</div>
              <Button variant="outline" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          )}
        </>
      )}

      {selectedShop && (
        <ConnectRequestDialog
          isOpen={dialogOpen}
          onClose={() => setDialogOpen(false)}
          targetId={selectedShop.id}
          targetName={selectedShop.name}
          initiatorType="supplier"
          onSuccess={handleConnectSuccess}
        />
      )}
    </div>
  );
}
