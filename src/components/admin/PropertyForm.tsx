import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Upload, Home, DollarSign, MapPin, Images, Settings, Sparkles, Bed, Bath, Users, Square, Clock, FileText, Shield, Star } from 'lucide-react';
import { useCreateProperty, useUpdateProperty } from '../../hooks/useProperties';
import { propertyImageQueries } from '../../lib/queries';
import { useToast } from '../../contexts/ToastContext';
import type { PropertyWithImages, CreatePropertyInput, PropertyStatus, PropertyImage } from '../../types/database';
import { supabase } from '../../lib/supabase';
import { GrMapLocation } from 'react-icons/gr';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { PiPaintBrushHousehold } from 'react-icons/pi';

// Fix for default marker icons in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component to update map center when coordinates change
function MapUpdater({ lat, lng }: { lat?: number; lng?: number }) {
  const map = useMap();
  
  useEffect(() => {
    if (lat !== undefined && lng !== undefined) {
      map.setView([lat, lng], map.getZoom());
    }
  }, [lat, lng, map]);
  
  return null;
}

// Component to handle map clicks
function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  const map = useMap();
  
  useEffect(() => {
    const handleClick = (e: L.LeafletMouseEvent) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    };
    
    map.on('click', handleClick);
    
    return () => {
      map.off('click', handleClick);
    };
  }, [map, onMapClick]);
  
  return null;
}

// Modern Checkbox Component
interface ModernCheckboxProps {
  checked: boolean;
  onChange: () => void;
  id?: string;
}

function ModernCheckbox({ checked, onChange, id }: ModernCheckboxProps) {
  return (
    <label 
      htmlFor={id}
      className="relative inline-flex items-center cursor-pointer group"
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="sr-only peer"
      />
      <div className={`
        relative w-5 h-5 rounded-md border-2 transition-all duration-300 ease-out
        ${checked 
          ? 'bg-[#1a1a1a] border-[#1a1a1a] shadow-sm' 
          : 'bg-white border-gray-300 group-hover:border-[#1a1a1a] group-hover:bg-gray-50'
        }
      `}>
        {/* Checkmark */}
        <svg
          className={`absolute inset-0 w-full h-full text-white transition-all duration-300 ease-out ${
            checked ? 'opacity-100 scale-100' : 'opacity-0 scale-0'
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={3}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 13l4 4L19 7"
          />
        </svg>
        {/* Ripple effect on click */}
        <span className={`
          absolute inset-0 rounded-md bg-[#1a1a1a] opacity-0 scale-0
          transition-all duration-300 ease-out
          ${checked ? 'animate-ping' : ''}
        `} />
      </div>
    </label>
  );
}

interface PropertyFormProps {
  property?: PropertyWithImages | null;
  onClose: () => void;
}

interface ImageInput {
  id?: string;
  url: string;
  alt_text: string;
  caption: string;
  is_primary: boolean;
  display_order: number;
}

const propertyTypes = ['house', 'apartment', 'condo', 'townhouse', 'villa', 'studio'];
const commonAmenities = [
  'WiFi', 'Air Conditioning', 'Heating', 'Kitchen', 'Washer', 'Dryer',
  'Parking', 'TV', 'Pool', 'Hot Tub', 'Gym', 'Pet Friendly',
  'Smoking Allowed', 'Wheelchair Accessible', 'Elevator', 'Balcony',
  'Fireplace', 'Dishwasher', 'Microwave', 'Coffee Maker', 'Refrigerator'
];

export default function PropertyForm({ property, onClose }: PropertyFormProps) {
  const isEditMode = !!property;
  const { createProperty, loading: creating } = useCreateProperty();
  const { updateProperty, loading: updating } = useUpdateProperty();
  const { success, error: showError } = useToast();

  const [formData, setFormData] = useState<CreatePropertyInput>({
    title: '',
    description: '',
    property_type: 'house',
    bedrooms: 1,
    bathrooms: 1,
    max_guests: 2,
    area_sqft: undefined,
    price_per_night: 0,
    cleaning_fee: 0,
    security_deposit: 0,
    address: '',
    city: '',
    state: '',
    zip_code: '',
    country: 'Benin',
    latitude: undefined,
    longitude: undefined,
    amenities: [],
    house_rules: '',
    cancellation_policy: '',
    safety_property: '',
    check_in_time: '15:00',
    check_out_time: '11:00',
    minimum_nights: 1,
    maximum_nights: undefined,
    status: 'active',
    is_featured: false,
  });

  const [images, setImages] = useState<ImageInput[]>([]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploadingImages, setUploadingImages] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [compressingImages, setCompressingImages] = useState(false);
  
  // Default location: Benin Republic (Cotonou)
  const defaultLat = 6.4969;
  const defaultLng = 2.6289;

  // Load property data if editing
  useEffect(() => {
    if (property) {
      setFormData({
        title: property.title,
        description: property.description || '',
        property_type: property.property_type,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        max_guests: property.max_guests,
        area_sqft: property.area_sqft || undefined,
        price_per_night: property.price_per_night,
        cleaning_fee: property.cleaning_fee,
        security_deposit: property.security_deposit,
        address: property.address,
        city: property.city,
        state: property.state,
        zip_code: property.zip_code || '',
        country: property.country,
        latitude: property.latitude || undefined,
        longitude: property.longitude || undefined,
        amenities: property.amenities || [],
        house_rules: property.house_rules || '',
        cancellation_policy: property.cancellation_policy || '',
        safety_property: property.safety_property || '',
        check_in_time: property.check_in_time,
        check_out_time: property.check_out_time,
        minimum_nights: property.minimum_nights,
        maximum_nights: property.maximum_nights || undefined,
        status: property.status,
        is_featured: property.is_featured,
      });
      setSelectedAmenities(property.amenities || []);
      
      // Load images
      if (property.images && property.images.length > 0) {
        setImages(property.images.map(img => ({
          id: img.id,
          url: img.image_url,
          alt_text: img.alt_text || '',
          caption: img.caption || '',
          is_primary: img.is_primary,
          display_order: img.display_order,
        })));
      }
    }
  }, [property]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.state.trim()) newErrors.state = 'Area is required';
    if (formData.price_per_night <= 0) newErrors.price_per_night = 'Price must be greater than 0';
    if (formData.bedrooms < 0) newErrors.bedrooms = 'Bedrooms must be 0 or more';
    if (formData.bathrooms <= 0) newErrors.bathrooms = 'Bathrooms must be greater than 0';
    if (formData.max_guests <= 0) newErrors.max_guests = 'Max guests must be greater than 0';
    if (formData.minimum_nights < 1) newErrors.minimum_nights = 'Minimum nights must be at least 1';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Compress image to at least 100KB threshold
  const compressImage = async (file: File, maxSizeKB: number = 100): Promise<File> => {
    return new Promise((resolve, reject) => {
      // If file is already under threshold, return as is
      if (file.size <= maxSizeKB * 1024) {
        resolve(file);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDimension = 1920; // Max width or height

          // Resize if too large
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = (height / width) * maxDimension;
              width = maxDimension;
            } else {
              width = (width / height) * maxDimension;
              height = maxDimension;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          // Try different quality levels to get under threshold
          const tryCompress = (quality: number): void => {
            canvas.toBlob(
              (blob: Blob | null) => {
                if (!blob) {
                  reject(new Error('Failed to compress image'));
                  return;
                }

                const sizeKB = blob.size / 1024;

                // If under threshold or quality is too low, use this
                if (sizeKB <= maxSizeKB || quality <= 0.1) {
                  const compressedFile = new File([blob], file.name, {
                    type: 'image/jpeg',
                    lastModified: Date.now(),
                  });
                  resolve(compressedFile);
                } else {
                  // Try lower quality
                  tryCompress(quality - 0.1);
                }
              },
              'image/jpeg',
              quality
            );
          };

          // Start with 0.9 quality
          tryCompress(0.9);
        };

        img.onerror = () => {
          reject(new Error('Failed to load image'));
        };

        if (e.target && typeof e.target.result === 'string') {
          img.src = e.target.result;
        } else {
          reject(new Error('Failed to read file'));
        }
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = async (file: File): Promise<{ url: string | null; error: string | null }> => {
    try {
      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const filePath = `properties/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('property-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        
        // Provide helpful error messages
        let errorMessage = 'Unknown error';
        if (uploadError.message?.includes('Bucket not found') || uploadError.message?.includes('not found')) {
          errorMessage = 'Storage bucket "property-images" not found. Please create it in your Supabase dashboard: Storage > Create Bucket > Name: "property-images" > Public: Yes';
        } else if (uploadError.message?.includes('new row violates row-level security') || uploadError.message?.includes('permission') || uploadError.message?.includes('denied')) {
          errorMessage = 'Permission denied: Please check your storage bucket policies. Ensure authenticated users can upload to the "property-images" bucket.';
        } else {
          errorMessage = uploadError.message || 'Unknown error';
        }
        
        return { url: null, error: errorMessage };
      }

      const { data: { publicUrl } } = supabase.storage
        .from('property-images')
        .getPublicUrl(filePath);

      return { url: publicUrl, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Error uploading image:', err);
      return { url: null, error: errorMessage };
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImages(true);
    setCompressingImages(true);
    try {
      const fileArray = Array.from(files);
      let processedCount = 0;
      let successCount = 0;
      let failureCount = 0;
      const errors: string[] = [];

      for (const file of fileArray) {
        try {
          // Compress image if needed
          const compressedFile = await compressImage(file, 100);
          
          // Show progress
          processedCount++;
          if (processedCount === fileArray.length) {
            setCompressingImages(false);
          }

          const result = await handleImageUpload(compressedFile);
          if (result.url) {
            const newImage: ImageInput = {
              url: result.url,
              alt_text: file.name.replace(/\.[^/.]+$/, ''), // Remove extension from name
              caption: '',
              is_primary: images.length === 0,
              display_order: images.length,
            };
            setImages(prev => [...prev, newImage]);
            successCount++;
          } else {
            failureCount++;
            if (result.error) {
              errors.push(result.error);
            } else {
              errors.push(file.name);
            }
          }
        } catch (err) {
          failureCount++;
          const errorMessage = err instanceof Error ? err.message : 'Unknown error';
          console.error('Error processing image:', err);
          errors.push(`${file.name}: ${errorMessage}`);
        }
      }

      // Show summary messages
      if (failureCount > 0 && successCount === 0) {
        // All failed - show the first error (usually the most relevant, like bucket not found)
        const firstError = errors[0] || 'Failed to upload images';
        showError(firstError);
      } else if (failureCount > 0) {
        // Some succeeded, some failed
        const firstError = errors[0] || 'Some images failed to upload';
        showError(`${successCount} image(s) uploaded successfully, but ${failureCount} failed. ${firstError}`);
      } else if (successCount > 0) {
        success(`Successfully uploaded ${successCount} image(s)`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Error in file input handler:', err);
      showError(`Failed to process images: ${errorMessage}`);
    } finally {
      setUploadingImages(false);
      setCompressingImages(false);
    }
    
    // Reset input
    e.target.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
      showError('Please fix the errors in the form');
      return;
    }

    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user || !user.email) {
        showError('You must be logged in to create properties.');
        console.error('User error:', userError);
        return;
      }

      // Get or create host record for the current admin user
      let hostsData: { id: string } | null = null;
      
      // First, try to find existing host by email
      const { data: existingHost, error: findError } = await supabase
        .from('hosts')
        .select('id')
        .eq('email', user.email)
        .maybeSingle();

      if (findError && findError.code !== 'PGRST116') {
        // PGRST116 is "no rows returned" which is fine
        showError(`Error checking for host: ${findError.message}`);
        console.error('Host find error:', findError);
        return;
      }

      if (existingHost) {
        // Use existing host
        hostsData = existingHost;
      } else {
        // Create a new host record for the admin
        // Extract name from email or use defaults
        const emailParts = user.email.split('@')[0];
        const firstName = user.user_metadata?.first_name || emailParts.split('.')[0] || 'Admin';
        const lastName = user.user_metadata?.last_name || emailParts.split('.')[1] || 'User';
        
        const { data: newHost, error: createHostError } = await supabase
          .from('hosts')
          .insert({
            email: user.email,
            first_name: firstName.charAt(0).toUpperCase() + firstName.slice(1),
            last_name: lastName.charAt(0).toUpperCase() + lastName.slice(1),
            status: 'active',
            is_verified: true,
          })
          .select('id')
          .single();

        if (createHostError || !newHost) {
          showError(`Failed to create host record: ${createHostError?.message || 'Unknown error'}`);
          console.error('Create host error:', createHostError);
          return;
        }

        hostsData = newHost;
        console.log('Created new host record for admin:', hostsData.id);
      }

      const propertyData: CreatePropertyInput = {
        ...formData,
        amenities: selectedAmenities,
      };

      let propertyId: string;

      if (isEditMode && property) {
        // Update existing property
        try {
          const updated = await updateProperty(property.id, propertyData);
          if (!updated) {
            showError('Failed to update property. This may be a permissions issue. Please check the console for details.');
            console.error('Update returned null - check RLS policies');
            
            // Log helpful debugging info
            const { data: { user } } = await supabase.auth.getUser();
            console.log('Current user:', user?.email);
            console.log('User authenticated:', !!user);
            console.log('Property ID:', property.id);
            console.log('Property data:', propertyData);
            
            return;
          }
          propertyId = property.id;
        } catch (updateError: any) {
          const errorMessage = updateError?.message || 'Unknown error occurred';
          showError(`Failed to update property: ${errorMessage}`);
          console.error('Update error:', updateError);
          return;
        }
      } else {
        // Create new property - need to add host_id directly to database
        const { data: created, error: createError } = await supabase
          .from('properties')
          .insert({
            ...propertyData,
            host_id: hostsData.id,
          })
          .select()
          .single();

        if (createError) {
          const errorMessage = createError.message || 'Unknown error occurred';
          
          // Provide helpful error message for RLS violations
          if (createError.code === '42501') {
            showError(
              'Permission denied: You must be authenticated as an admin to create properties. ' +
              'Please ensure: 1) You are logged in, 2) Your email is in the admins table, ' +
              '3) Your admin status is "active". Check the console for details.'
            );
          } else {
            showError(`Failed to create property: ${errorMessage}`);
          }
          
          console.error('Create error details:', {
            error: createError,
            code: createError.code,
            message: createError.message,
            details: createError.details,
            hint: createError.hint,
            propertyData: { ...propertyData, host_id: hostsData.id }
          });
          
          // Log helpful debugging info
          const { data: { user } } = await supabase.auth.getUser();
          console.log('Current user:', user?.email);
          console.log('User authenticated:', !!user);
          
          return;
        }

        if (!created) {
          showError('Failed to create property: No data returned');
          console.error('Create returned no data');
          return;
        }

        propertyId = created.id;
      }

      // Handle images
      if (images.length > 0) {
        // Delete existing images if editing
        if (isEditMode && property?.images) {
          for (const img of property.images) {
            await propertyImageQueries.delete(img.id);
          }
        }

        // Find the first image that should be primary (or default to first image)
        const foundPrimaryIndex = images.findIndex(img => img.is_primary);
        const primaryImageIndex = foundPrimaryIndex >= 0 ? foundPrimaryIndex : 0;

        // Add new images
        const imageErrors: string[] = [];
        for (let i = 0; i < images.length; i++) {
          const img = images[i];
          if (!img.url || !img.url.trim()) {
            console.warn(`Skipping image at index ${i} - no URL provided`);
            continue;
          }
          
          try {
            // Only set the first primary image as primary to avoid unique constraint violation
            const isPrimary = i === primaryImageIndex;
            
            const imageResult = await propertyImageQueries.add({
              property_id: propertyId,
              image_url: img.url.trim(),
              alt_text: img.alt_text || undefined,
              caption: img.caption || undefined,
              display_order: i,
              is_primary: isPrimary,
            });

            if (!imageResult) {
              imageErrors.push(`Image ${i + 1}: Failed to add (check console for details)`);
              console.error(`Failed to add image at index ${i}`);
            }
          } catch (imgError: any) {
            const errorMsg = imgError?.message || 'Unknown error';
            imageErrors.push(`Image ${i + 1}: ${errorMsg}`);
            console.error(`Error adding image at index ${i}:`, imgError);
          }
        }

        // Show warning if some images failed to add
        if (imageErrors.length > 0) {
          console.warn('Some images failed to add:', imageErrors);
          // Don't fail the whole operation, just warn
          showError(`Property ${isEditMode ? 'updated' : 'created'} but ${imageErrors.length} image(s) failed to add. Check console for details.`);
        }
      }

      success(`Property ${isEditMode ? 'updated' : 'created'} successfully`);
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      showError(`Failed to ${isEditMode ? 'update' : 'create'} property: ${errorMessage}`);
      console.error('Unexpected error in handleSubmit:', err);
    }
  };

  const addImage = () => {
    setImages(prev => [...prev, {
      url: '',
      alt_text: '',
      caption: '',
      is_primary: prev.length === 0,
      display_order: prev.length,
    }]);
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index).map((img, i) => ({
      ...img,
      display_order: i,
      is_primary: i === 0 ? true : img.is_primary,
    })));
  };

  const setPrimaryImage = (index: number) => {
    setImages(prev => prev.map((img, i) => ({
      ...img,
      is_primary: i === index,
    })));
  };

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities(prev =>
      prev.includes(amenity)
        ? prev.filter(a => a !== amenity)
        : [...prev, amenity]
    );
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      showError('Geolocation is not supported by your browser');
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setFormData({
          ...formData,
          latitude,
          longitude,
        });
        setGettingLocation(false);
        success('Location retrieved successfully');
      },
      (error) => {
        setGettingLocation(false);
        let errorMessage = 'Failed to get your location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please enable location permissions.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
        }
        showError(errorMessage);
      }
    );
  };

  // Get current map center coordinates
  const getMapCenter = (): [number, number] => {
    if (
      formData.latitude !== undefined && 
      formData.longitude !== undefined &&
      !isNaN(formData.latitude) &&
      !isNaN(formData.longitude)
    ) {
      return [formData.latitude, formData.longitude];
    }
    return [defaultLat, defaultLng];
  };

  const loading = creating || updating || uploadingImages || compressingImages;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[95vh] overflow-hidden shadow-xl  flex flex-col">
        {/* Header */}
        <div className="relative bg-[#1a1a1a] px-8 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center">
              {isEditMode ? (
                <Home className="w-6 h-6 text-white" />
              ) : (
                <PiPaintBrushHousehold className="w-6 h-6 text-yellow-400" />
              )}
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-white">
                {isEditMode ? 'Edit Property' : 'Add New Property'}
              </h2>
              <p className="text-sm font-light text-white/80 mt-0.5">
                {isEditMode ? 'Update your property details' : 'Create an amazing listing for your property'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 hover:bg-white/10 rounded-xl transition-all duration-200 text-white hover:rotate-90"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Container */}
        <div className="flex-1 overflow-y-auto">

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {/* Basic Information */}
          <div className="space-y-5">
            <div className="flex items-center gap-3 pb-2 border-b border-gray-200">
              <div className="w-10 h-10 rounded-xl bg-[#1a1a1a]/30 flex items-center justify-center">
                <Home className="w-5 h-5 text-[#1a1a1a]" />
              </div>
              <h3 className="text-xl font-bold text-[#1a1a1a]">Basic Information</h3>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-[#1a1a1a] mb-2">
                Property Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Cozy Beachfront Villa with Ocean View"
                className={`w-full px-4 py-3 border rounded-xl focus:ring-0.5 focus:ring-[#1a1a1a] focus:border-[#1a1a1a] transition-all duration-200 bg-gray-50/50 hover:bg-white ${
                  errors.title ? 'border-red-400 bg-red-50/50' : 'border-[#1a1a1a]/30'
                }`}
              />
              {errors.title && <p className="mt-2 text-sm text-red-600 font-medium">{errors.title}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#1a1a1a] mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                placeholder="Describe what makes your property special..."
                className="w-full px-4 py-3 border border-[#1a1a1a]/30 rounded-xl focus:ring-0.5 focus:ring-[#1a1a1a] focus:border-[#1a1a1a] transition-all duration-200 bg-gray-50/50 hover:bg-white resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-[#1a1a1a] mb-2">
                  Property Type *
                </label>
                <select
                  value={formData.property_type}
                  onChange={(e) => setFormData({ ...formData, property_type: e.target.value })}
                  className="w-full px-4 py-3 border border-[#1a1a1a]/30 rounded-xl focus:ring-0.5 focus:ring-[#1a1a1a] focus:border-[#1a1a1a] transition-all duration-200 bg-gray-50/50 hover:bg-white"
                >
                  {propertyTypes.map(type => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#1a1a1a] mb-2 flex items-center gap-2">
                  <Bed className="w-4 h-4 text-[#1a1a1a]" />
                  Bedrooms *
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.bedrooms}
                  onChange={(e) => setFormData({ ...formData, bedrooms: parseInt(e.target.value) || 0 })}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-0.5 focus:ring-[#1a1a1a] focus:border-[#1a1a1a] transition-all duration-200 bg-gray-50/50 hover:bg-white ${
                    errors.bedrooms ? 'border-red-400 bg-red-50/50' : 'border-[#1a1a1a]/30'
                  }`}
                />
                {errors.bedrooms && <p className="mt-2 text-sm text-red-600 font-medium">{errors.bedrooms}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#1a1a1a] mb-2 flex items-center gap-2">
                  <Bath className="w-4 h-4 text-gray-500" />
                  Bathrooms *
                </label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={formData.bathrooms}
                  onChange={(e) => setFormData({ ...formData, bathrooms: parseFloat(e.target.value) || 0 })}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#1a1a1a] focus:border-[#1a1a1a] transition-all duration-200 bg-gray-50/50 hover:bg-white ${
                    errors.bathrooms ? 'border-red-400 bg-red-50/50' : 'border-[#1a1a1a]/30'
                  }`}
                />
                {errors.bathrooms && <p className="mt-2 text-sm text-red-600 font-medium">{errors.bathrooms}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-[#1a1a1a] mb-2 flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#1a1a1a]" />
                  Max Guests *
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.max_guests}
                  onChange={(e) => setFormData({ ...formData, max_guests: parseInt(e.target.value) || 1 })}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-0.5 focus:ring-[#1a1a1a] focus:border-[#1a1a1a] transition-all duration-200 bg-gray-50/50 hover:bg-white ${
                    errors.max_guests ? 'border-red-400 bg-red-50/50' : 'border-gray-200'
                  }`}
                />
                {errors.max_guests && <p className="mt-2 text-sm text-red-600 font-medium">{errors.max_guests}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#1a1a1a] mb-2 flex items-center gap-2">
                  <Square className="w-4 h-4 text-gray-500" />
                  Area (sq ft)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.area_sqft || ''}
                  onChange={(e) => setFormData({ ...formData, area_sqft: e.target.value ? parseInt(e.target.value) : undefined })}
                  placeholder="e.g., 1200"
                  className="w-full px-4 py-3 border border-[#1a1a1a]/30 rounded-xl focus:ring-0.5 focus:ring-[#1a1a1a] focus:border-[#1a1a1a] transition-all duration-200 bg-gray-50/50 hover:bg-white"
                />
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-5">
            <div className="flex items-center gap-3 pb-2 border-b border-gray-200">
              <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-[#1a1a1a]">Pricing</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-[#1a1a1a] mb-2">
                  Price per Night *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">XOF</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price_per_night}
                    onChange={(e) => setFormData({ ...formData, price_per_night: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                    className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#1a1a1a] focus:border-[#1a1a1a] transition-all duration-200 bg-gray-50/50 hover:bg-white ${
                      errors.price_per_night ? 'border-red-400 bg-red-50/50' : 'border-[#1a1a1a]/30'
                    }`}
                  />
                </div>
                {errors.price_per_night && <p className="mt-2 text-sm text-red-600 font-medium">{errors.price_per_night}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#1a1a1a] mb-2">
                  Cleaning Fee
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1a1a1a]/70 font-medium">XOF</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.cleaning_fee || 0}
                    onChange={(e) => setFormData({ ...formData, cleaning_fee: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                    className="w-full pl-12 pr-4 py-3 border border-[#1a1a1a]/30 rounded-xl focus:ring-0.5 focus:ring-[#1a1a1a] focus:border-[#1a1a1a] transition-all duration-200 bg-gray-50/50 hover:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#1a1a1a] mb-2">
                  Security Deposit
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1a1a1a]/70 font-medium">XOF</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.security_deposit || 0}
                    onChange={(e) => setFormData({ ...formData, security_deposit: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                    className="w-full pl-12 pr-4 py-3 border border-[#1a1a1a]/30 rounded-xl focus:ring-0.5 focus:ring-[#1a1a1a] focus:border-[#1a1a1a] transition-all duration-200 bg-gray-50/50 hover:bg-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="space-y-5">
            <div className="flex items-center gap-3 pb-2 border-b border-gray-200">
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-[#1a1a1a]">Location</h3>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-[#1a1a1a] mb-2">
                Address *
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="e.g., Rue de la Paix, Quartier Gbegamey"
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#1a1a1a] focus:border-[#1a1a1a] transition-all duration-200 bg-gray-50/50 hover:bg-white ${
                  errors.address ? 'border-red-400 bg-red-50/50' : 'border-[#1a1a1a]/30'
                }`}
              />
              {errors.address && <p className="mt-2 text-sm text-red-600 font-medium">{errors.address}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-[#1a1a1a] mb-2">
                  City *
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="e.g., Cotonou, Porto-Novo"
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#1a1a1a] focus:border-[#1a1a1a] transition-all duration-200 bg-gray-50/50 hover:bg-white ${
                    errors.city ? 'border-red-400 bg-red-50/50' : 'border-[#1a1a1a]/30'
                  }`}
                />
                {errors.city && <p className="mt-2 text-sm text-red-600 font-medium">{errors.city}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#1a1a1a] mb-2">
                  Area *
                </label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  placeholder="e.g., Littoral, Ouémé"
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#1a1a1a] focus:border-[#1a1a1a] transition-all duration-200 bg-gray-50/50 hover:bg-white ${
                    errors.state ? 'border-red-400 bg-red-50/50' : 'border-[#1a1a1a]/30'
                  }`}
                />
                {errors.state && <p className="mt-2 text-sm text-red-600 font-medium">{errors.state}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#1a1a1a] mb-2">
                  Country
                </label>
                <input
                  type="text"
                  value={formData.country || 'Benin'}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="w-full px-4 py-3 border border-[#1a1a1a]/30 rounded-xl focus:ring-0.5 focus:ring-[#1a1a1a] focus:border-[#1a1a1a] transition-all duration-200 bg-gray-50/50 hover:bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-[#1a1a1a] mb-2">
                  Latitude
                </label>
                <input
                  type="number"
                  step="any"
                  value={formData.latitude || ''}
                  onChange={(e) => setFormData({ ...formData, latitude: e.target.value ? parseFloat(e.target.value) : undefined })}
                  placeholder="6.4969"
                  className="w-full px-4 py-3 border border-[#1a1a1a]/30 rounded-xl focus:ring-0.5 focus:ring-[#1a1a1a] focus:border-[#1a1a1a] transition-all duration-200 bg-gray-50/50 hover:bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#1a1a1a] mb-2">
                  Longitude
                </label>
                <input
                  type="number"
                  step="any"
                  value={formData.longitude || ''}
                  onChange={(e) => setFormData({ ...formData, longitude: e.target.value ? parseFloat(e.target.value) : undefined })}
                  placeholder="2.6289"
                  className="w-full px-4 py-3 border border-[#1a1a1a]/30 rounded-xl focus:ring-0.5 focus:ring-[#1a1a1a] focus:border-[#1a1a1a] transition-all duration-200 bg-gray-50/50 hover:bg-white"
                />
              </div>
            </div>

            {/* Get Current Location Button */}
            <div>
              <button
                type="button"
                onClick={handleGetCurrentLocation}
                disabled={gettingLocation}
                className="inline-flex items-center px-5 py-2.5 bg-[#1a1a1a] text-white rounded-xl hover:bg-[#2a2a2a] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg hover:shadow-xl"
              >
                {gettingLocation ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Getting Location...
                  </>
                ) : (
                  <>
                    <GrMapLocation className="w-4 h-4 mr-2" />
                    Use My Current Location
                  </>
                )}
              </button>
            </div>

            {/* Minimap */}
            <div className="mt-4">
              <label className="block text-sm font-semibold text-[#1a1a1a] mb-2">
                Location Map
              </label>
              <div className="relative w-full h-64 rounded-xl overflow-hidden shadow-lg">
                <MapContainer
                  center={getMapCenter()}
                  zoom={formData.latitude && formData.longitude ? 13 : 7}
                  className="w-full h-full"
                  scrollWheelZoom={true}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {formData.latitude !== undefined && formData.longitude !== undefined && (
                    <Marker position={[formData.latitude, formData.longitude]}>
                      <Popup>
                        <div className="p-2">
                          <h3 className="font-medium text-sm mb-1">Property Location</h3>
                          <p className="text-xs text-gray-600">
                            {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
                          </p>
                        </div>
                      </Popup>
                    </Marker>
                  )}
                  <MapUpdater lat={formData.latitude} lng={formData.longitude} />
                  <MapClickHandler 
                    onMapClick={(lat, lng) => {
                      setFormData({
                        ...formData,
                        latitude: lat,
                        longitude: lng,
                      });
                    }}
                  />
                </MapContainer>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                {formData.latitude && formData.longitude 
                  ? 'Click on the map to change location, or use the button above to get your current location'
                  : 'Default location: Benin Republic. Click on the map, use the button above, or enter coordinates manually to set your location.'}
              </p>
            </div>
          </div>

          {/* Amenities */}
          <div className="space-y-5">
            <div className="flex items-center gap-3 pb-2 border-b border-gray-200">
              <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-[#1a1a1a]">Amenities</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {commonAmenities.map(amenity => (
                <label 
                  key={amenity} 
                  className={`flex items-center space-x-3 cursor-pointer p-3.5 rounded-xl border-2 transition-all duration-300 ease-out group ${
                    selectedAmenities.includes(amenity)
                      ? 'border-[#1a1a1a] bg-[#1a1a1a]/5 shadow-sm'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/50 hover:shadow-sm'
                  }`}
                >
                  <ModernCheckbox
                    id={`amenity-${amenity}`}
                    checked={selectedAmenities.includes(amenity)}
                    onChange={() => toggleAmenity(amenity)}
                  />
                  <span className={`text-sm font-medium flex-1 transition-colors duration-200 ${
                    selectedAmenities.includes(amenity) 
                      ? 'text-gray-900 font-semibold' 
                      : 'text-gray-700 group-hover:text-gray-900'
                  }`}>
                    {amenity}
                  </span>
                </label>
              ))}
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#1a1a1a] mb-2">
                Custom Amenities (comma-separated)
              </label>
              <input
                type="text"
                placeholder="e.g., Ocean View, Mountain View, Rooftop Access"
                value={selectedAmenities.filter(a => !commonAmenities.includes(a)).join(', ')}
                onChange={(e) => {
                  const custom = e.target.value.split(',').map(s => s.trim()).filter(s => s);
                  setSelectedAmenities([
                    ...selectedAmenities.filter(a => commonAmenities.includes(a)),
                    ...custom
                  ]);
                }}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1a1a1a] focus:border-[#1a1a1a] transition-all duration-200 bg-gray-50/50 hover:bg-white"
              />
            </div>
          </div>

          {/* Images */}
          <div className="space-y-5">
            <div className="flex items-center justify-between pb-2 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-pink-100 flex items-center justify-center">
                  <Images className="w-5 h-5 text-pink-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#1a1a1a]">Images</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {images.length > 0 
                      ? `${images.length} image${images.length !== 1 ? 's' : ''} • Images will be compressed to ~100KB`
                      : 'Upload images (will be automatically compressed to ~100KB)'}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <label className="inline-flex items-center px-5 py-2.5 bg-[#1a1a1a] text-white rounded-xl hover:bg-[#2a2a2a] cursor-pointer transition-all duration-200 font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed">
                  {compressingImages ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Compressing...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Images
                    </>
                  )}
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileInput}
                    disabled={uploadingImages || compressingImages}
                    className="hidden"
                  />
                </label>
                <button
                  type="button"
                  onClick={addImage}
                  disabled={uploadingImages || compressingImages}
                  className="inline-flex items-center px-5 py-2.5 border-2 border-gray-200 text-gray-700 rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add URL
                </button>
              </div>
            </div>

            {images.length === 0 ? (
              <div className="border border-dashed border-[#1a1a1a]/30 rounded-xl p-16 text-center bg-gray-50/30 hover:bg-gray-50/50 transition-all duration-300">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <Images className="w-8 h-8 text-[#1a1a1a]/40" />
                </div>
                <p className="text-gray-700 font-medium text-sm mb-1">No images added yet</p>
                <p className="text-xs text-gray-400">Upload images or add image URLs to get started</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {images.map((img, index) => (
                  <div 
                    key={index} 
                    className={`group relative rounded-xl overflow-hidden bg-white transition-all duration-300 ${
                      img.is_primary 
                        ? 'ring-2 ring-yellow-400/50 shadow-lg shadow-yellow-400/10' 
                        : 'border border-gray-100 hover:border-gray-200 hover:shadow-lg'
                    }`}
                  >
                    {/* Image Preview - Clean & Minimal */}
                    {img.url ? (
                      <div className="relative aspect-[4/3] bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
                        <img
                          src={img.url}
                          alt={img.alt_text || `Image ${index + 1}`}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                              parent.innerHTML = '<div class="w-full h-full flex items-center justify-center text-gray-300"><Images class="w-10 h-10" /></div>';
                            }
                          }}
                        />
                        
                        {/* Badges - Top overlay */}
                        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between z-10">
                          {/* Primary Badge */}
                          {img.is_primary && (
                            <div className="bg-yellow-400 text-white px-2.5 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wide shadow-sm flex items-center gap-1">
                              <Star className="w-2.5 h-2.5 fill-white" />
                              Primary
                            </div>
                          )}
                          {/* Image number badge - only show if not primary or on the right */}
                          {!img.is_primary && (
                            <div className="bg-black/50 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-0.5 rounded-md ml-auto">
                              #{index + 1}
                            </div>
                          )}
                        </div>

                        {/* Hover overlay with actions */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setPrimaryImage(index)}
                              className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 shadow-lg ${
                                img.is_primary
                                  ? 'bg-yellow-400 text-white'
                                  : 'bg-white/95 text-gray-700 hover:bg-white backdrop-blur-sm'
                              }`}
                            >
                              {img.is_primary ? '✓ Primary' : 'Set Primary'}
                            </button>
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="p-2 bg-white/95 hover:bg-red-50 text-gray-600 hover:text-red-600 rounded-lg transition-all duration-200 backdrop-blur-sm shadow-lg"
                              title="Remove image"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="aspect-[4/3] bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center relative">
                        <div className="text-center">
                          <Images className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                          <p className="text-xs text-gray-400">No image</p>
                        </div>
                        {/* Image number badge for empty state */}
                        <div className="absolute top-2.5 right-2.5 bg-gray-200 text-gray-600 text-[10px] font-semibold px-2 py-0.5 rounded-md">
                          #{index + 1}
                        </div>
                      </div>
                    )}

                    {/* Image Details - Compact & Minimal */}
                    <div className="p-4 space-y-3">
                      <div>
                        <input
                          type="text"
                          placeholder="Image URL *"
                          value={img.url}
                          onChange={(e) => {
                            const newImages = [...images];
                            newImages[index].url = e.target.value;
                            setImages(newImages);
                          }}
                          className="w-full px-3 py-2.5 text-xs border border-gray-200 rounded-lg focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] bg-gray-50/50 hover:bg-gray-50 transition-all duration-200 placeholder:text-gray-400"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Alt text"
                          value={img.alt_text}
                          onChange={(e) => {
                            const newImages = [...images];
                            newImages[index].alt_text = e.target.value;
                            setImages(newImages);
                          }}
                          className="px-3 py-2.5 text-xs border border-gray-200 rounded-lg focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] bg-gray-50/50 hover:bg-gray-50 transition-all duration-200 placeholder:text-gray-400"
                        />
                        <input
                          type="text"
                          placeholder="Caption"
                          value={img.caption}
                          onChange={(e) => {
                            const newImages = [...images];
                            newImages[index].caption = e.target.value;
                            setImages(newImages);
                          }}
                          className="px-3 py-2.5 text-xs border border-gray-200 rounded-lg focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] bg-gray-50/50 hover:bg-gray-50 transition-all duration-200 placeholder:text-gray-400"
                        />
                      </div>

                      {/* Remove button - always visible for better UX */}
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="w-full px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5 border border-red-200 hover:border-red-300"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Remove Image
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Additional Details */}
          <div className="space-y-5">
            <div className="flex items-center gap-3 pb-2 border-b border-gray-200">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                <Settings className="w-5 h-5 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Additional Details</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  Check-in Time
                </label>
                <input
                  type="time"
                  value={formData.check_in_time}
                  onChange={(e) => setFormData({ ...formData, check_in_time: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1a1a1a] focus:border-[#1a1a1a] transition-all duration-200 bg-gray-50/50 hover:bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  Check-out Time
                </label>
                <input
                  type="time"
                  value={formData.check_out_time}
                  onChange={(e) => setFormData({ ...formData, check_out_time: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1a1a1a] focus:border-[#1a1a1a] transition-all duration-200 bg-gray-50/50 hover:bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Minimum Nights *
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.minimum_nights}
                  onChange={(e) => setFormData({ ...formData, minimum_nights: parseInt(e.target.value) || 1 })}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#1a1a1a] focus:border-[#1a1a1a] transition-all duration-200 bg-gray-50/50 hover:bg-white ${
                    errors.minimum_nights ? 'border-red-400 bg-red-50/50' : 'border-gray-200'
                  }`}
                />
                {errors.minimum_nights && <p className="mt-2 text-sm text-red-600 font-medium">{errors.minimum_nights}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Maximum Nights
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.maximum_nights || ''}
                  onChange={(e) => setFormData({ ...formData, maximum_nights: e.target.value ? parseInt(e.target.value) : undefined })}
                  placeholder="Optional"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1a1a1a] focus:border-[#1a1a1a] transition-all duration-200 bg-gray-50/50 hover:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-500" />
                House Rules
              </label>
              <textarea
                value={formData.house_rules || ''}
                onChange={(e) => setFormData({ ...formData, house_rules: e.target.value || undefined })}
                rows={3}
                placeholder="e.g., No smoking, No parties, Quiet hours after 10 PM"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1a1a1a] focus:border-[#1a1a1a] transition-all duration-200 bg-gray-50/50 hover:bg-white resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-500" />
                Cancellation Policy
              </label>
              <textarea
                value={formData.cancellation_policy || ''}
                onChange={(e) => setFormData({ ...formData, cancellation_policy: e.target.value || undefined })}
                rows={3}
                placeholder="Describe your cancellation policy..."
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1a1a1a] focus:border-[#1a1a1a] transition-all duration-200 bg-gray-50/50 hover:bg-white resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Shield className="w-4 h-4 text-gray-500" />
                Safety Information
              </label>
              <textarea
                value={formData.safety_property || ''}
                onChange={(e) => setFormData({ ...formData, safety_property: e.target.value || undefined })}
                rows={3}
                placeholder="Important safety information for guests..."
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1a1a1a] focus:border-[#1a1a1a] transition-all duration-200 bg-gray-50/50 hover:bg-white resize-none"
              />
            </div>
          </div>

          {/* Status and Featured */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as PropertyStatus })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1a1a1a] focus:border-[#1a1a1a] transition-all duration-200 bg-gray-50/50 hover:bg-white"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="maintenance">Maintenance</option>
                <option value="sold">Sold</option>
              </select>
            </div>

            <div className="flex items-center space-x-3 pt-6">
              <label 
                htmlFor="featured" 
                className={`flex items-center space-x-3 cursor-pointer p-4 rounded-xl border-2 transition-all duration-300 ease-out group flex-1 ${
                  formData.is_featured
                    ? 'border-yellow-400 bg-yellow-50 shadow-sm'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/50 hover:shadow-sm'
                }`}
              >
                <ModernCheckbox
                  id="featured"
                  checked={formData.is_featured || false}
                  onChange={() => setFormData({ ...formData, is_featured: !formData.is_featured })}
                />
                <div className="flex items-center gap-2 flex-1">
                  <Star className={`w-5 h-5 transition-colors duration-200 ${formData.is_featured ? 'text-yellow-500 fill-yellow-500' : 'text-gray-400 group-hover:text-gray-500'}`} />
                  <span className={`text-sm font-semibold transition-colors duration-200 ${formData.is_featured ? 'text-gray-900' : 'text-gray-700 group-hover:text-gray-900'}`}>
                    Featured Property
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t-2 border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border-2 border-gray-200 rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-[#1a1a1a] text-white rounded-xl hover:bg-[#2a2a2a] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : (
                <>
                  {isEditMode ? (
                    <>
                      <Home className="w-4 h-4" />
                      Update Property
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Create Property
                    </>
                  )}
                </>
              )}
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
}

