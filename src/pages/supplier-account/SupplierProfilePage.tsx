import { useState, useEffect } from "react";
import { UserCircle, Mail, Phone, MapPin, Building2, Store, FileText, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supplierConnectionAPI } from "@/lib/api";

export function SupplierProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    businessName: "",
    ownerName: "",
    category: "",
    phone: "",
    email: "",
    description: "",
    gstin: "",
    location: {
      city: "",
      state: "",
      pincode: ""
    }
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      // We don't have a specific getProfile endpoint, but we can get it from an auth status or dedicated endpoint.
      // Wait, let me add a dedicated endpoint to get the supplier account details.
      const response = await supplierConnectionAPI.getProfile();
      setProfile(response.data);
      setFormData({
        businessName: response.data.businessName || "",
        ownerName: response.data.ownerName || "",
        category: response.data.category || "",
        phone: response.data.phone || "",
        email: response.data.email || "",
        description: response.data.description || "",
        gstin: response.data.gstin || "",
        location: {
          city: response.data.location?.city || "",
          state: response.data.location?.state || "",
          pincode: response.data.location?.pincode || ""
        }
      });
    } catch (error) {
      console.error(error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await supplierConnectionAPI.updateProfile(formData);
      setProfile(response.data);
      toast.success("Profile updated successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[80vh]">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Business Profile</h1>
        <p className="text-muted-foreground mt-1">Manage how your business appears to shops in the directory.</p>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-1 space-y-6">
          <Card className="border-border/50 shadow-sm text-center">
            <CardContent className="pt-6 flex flex-col items-center">
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
                <Store className="w-12 h-12" />
              </div>
              <h3 className="font-bold text-xl">{profile?.businessName}</h3>
              <p className="text-sm text-muted-foreground mt-1">{profile?.category}</p>
            </CardContent>
          </Card>
          
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm">Profile Status</CardTitle>
            </CardHeader>
            <CardContent>
              {profile?.profileComplete ? (
                <div className="flex items-center gap-2 text-green-600 bg-green-500/10 p-3 rounded-lg text-sm font-medium">
                  <div className="w-2 h-2 rounded-full bg-green-600" />
                  Profile Complete
                </div>
              ) : (
                <div className="flex items-center gap-2 text-orange-600 bg-orange-500/10 p-3 rounded-lg text-sm font-medium">
                  <div className="w-2 h-2 rounded-full bg-orange-600 animate-pulse" />
                  Incomplete Profile
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-3">
                Complete your profile to become visible to shops in the directory.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-6">
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
              <CardDescription>Update your public business details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="businessName">Business Name *</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="businessName" 
                    className="pl-9" 
                    value={formData.businessName}
                    onChange={(e) => setFormData({...formData, businessName: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ownerName">Owner Name *</Label>
                  <div className="relative">
                    <UserCircle className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="ownerName" 
                      className="pl-9" 
                      value={formData.ownerName}
                      onChange={(e) => setFormData({...formData, ownerName: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Input 
                    id="category" 
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Business Description</Label>
                <Textarea 
                  id="description" 
                  placeholder="Tell shops about your business..."
                  className="resize-none h-24"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="phone" 
                      className="pl-9" 
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="email" 
                      className="pl-9 bg-muted" 
                      readOnly
                      value={formData.email}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gstin">GSTIN (Optional)</Label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="gstin" 
                    className="pl-9 uppercase" 
                    value={formData.gstin}
                    onChange={(e) => setFormData({...formData, gstin: e.target.value.toUpperCase()})}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle>Location</CardTitle>
              <CardDescription>Where is your business located?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="city" 
                      className="pl-9" 
                      value={formData.location.city}
                      onChange={(e) => setFormData({
                        ...formData, 
                        location: { ...formData.location, city: e.target.value }
                      })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State *</Label>
                  <Input 
                    id="state" 
                    value={formData.location.state}
                    onChange={(e) => setFormData({
                        ...formData, 
                        location: { ...formData.location, state: e.target.value }
                      })}
                  />
                </div>
              </div>
              <div className="space-y-2 w-1/2 pr-2">
                <Label htmlFor="pincode">Pincode</Label>
                <Input 
                  id="pincode" 
                  value={formData.location.pincode}
                  onChange={(e) => setFormData({
                      ...formData, 
                      location: { ...formData.location, pincode: e.target.value }
                    })}
                />
              </div>

              <div className="pt-6">
                <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
