import React, { useState, useEffect } from 'react';
import { TextField, Typography, Paper, Grid } from '@mui/material';
import axios from 'axios';
import { useRouter } from 'next/router';

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useForm } from 'react-hook-form';


import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface UpdateMerchantProps {
  id: string | string[] | undefined;
}


const UpdateMerchant: React.FC<UpdateMerchantProps> = ({ id }) => {

  const { register, handleSubmit, formState: { errors } } = useForm();

  const { toast } = useToast()
  const router = useRouter();
  const merchantId = id as string; // Extract merchant ID from the query parameters

  const [merchantInfo, setMerchantInfo] = useState<any>(null);
  const [updateInfo, setUpdateInfo] = useState({
    name: '',
    business_category: '',
    phone_number: '',
    email: '',
  });
  const [pincodesFormData, setPincodesFormData] = useState({
    pincodes: '',
  });

  useEffect(() => {
    if (merchantId) {
      // Fetch merchant information when the component mounts
      fetchMerchantInfo();
    }
  }, [merchantId]);

  const fetchMerchantInfo = async () => {
    try {
      const response = await axios.get(`http://127.0.0.1:8000/merchant/${merchantId}`);
      setMerchantInfo(response.data.data);
      setUpdateInfo(response.data.data);

      // toast({
      //   title: 'Success',
      //   description: "Merchant data fetched successfully from the server",
      //   // status: 'success',
      // });
    } catch (error) {
      console.error('Error fetching merchant information:', error);
      toast({
        title: "Error",
        description: "Merchant data couln't be retrieved from the server",
        // status: 'success',
      });
    }
  };

  const handleUpdateMerchantInfo = async () => {
    try {
      await axios.put(`http://127.0.0.1:8000/merchant/${merchantId}`, updateInfo);
      // Optionally, you can update the UI or navigate to another page
      console.log('Merchant information updated successfully');
      toast({
        title: 'Success',
        description: "Merchant data updated",
        // status: 'success',
      });
      fetchMerchantInfo();
    } catch (error) {
      console.error('Error updating merchant information:', error);
      toast({
        title: 'Error',
        variant: "destructive",
        description: "Merchant data was not updated on the servers",
        // status: 'success',
      });
    }
  };

  const handleAddPincodes = async () => {
    try {
      await axios.put(`http://127.0.0.1:8000/merchant/serviceability/${merchantId}`, {
        pincodes: pincodesFormData.pincodes.split(',').map((code) => code.trim()),
      });
      // Optionally, you can update the UI or navigate to another page
      console.log('Pincodes added successfully');
      toast({
        title: 'Success',
        description: "Pincodes added successfully",
        // status: 'success',
      });
      fetchMerchantInfo();
    } catch (error) {
      console.error('Error adding pincodes:', error);
      toast({
        title: 'Error',
        variant: "destructive",
        description: "Pincodes could not added",
        // status: 'success',
      });
    }
  };

  const handleDeletePincodes = async () => {
    try {
      await axios.delete(`http://127.0.0.1:8000/merchant/serviceability/${merchantId}`, {
        data: { pincodes: pincodesFormData.pincodes.split(',').map((code) => code.trim()) },
      });
      // Optionally, you can update the UI or navigate to another page
      console.log('Pincodes deleted successfully');
      toast({
        title: 'Success',
        description: "Pincodes deleted successfully",
        // status: 'success',
      });
      fetchMerchantInfo();
    } catch (error) {
      console.error('Error deleting pincodes:', error);
      toast({
        title: 'Error',
        variant: "destructive",
        description: "Pincodes could not deleted",
        // status: 'success',
      });
    }
  };

  if (!merchantInfo) {
    // Display a loading state or handle the case where merchant information is not available yet
    return <div>Loading...</div>;
  }

  return (
    <div>

      <div className='flex flex-col p-4 space-x-4'>
            <Card>
              <CardHeader>
                <CardTitle>Merchant Information </CardTitle>
                <CardDescription>Onboarded Merchant Information for merchant_id {merchantId}</CardDescription>
              </CardHeader>
              <CardContent>
                  <Paper elevation={3} className="p-4 mb-4">
                    {/* <Typography variant="h5" gutterBottom>
                      Merchant Information
                    </Typography> */}
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body1">
                          <strong>Name:</strong> {merchantInfo.name}
                        </Typography>
                        <Typography variant="body1">
                          <strong>Email:</strong> {merchantInfo.email}
                        </Typography>
                        <Typography variant="body1">
                          <strong>Phone Number:</strong> {merchantInfo.phone_number}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body1">
                          <strong>Business Category:</strong> {merchantInfo.business_category}
                        </Typography>
                        <Typography variant="body1">
                          <strong>Pincodes Serviced:</strong> {merchantInfo.pincodes_serviced}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Paper>
                  
                
              </CardContent>
              <CardFooter className="flex p-4">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button className='flex px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring focus:border-blue-300'>
                  Update Merchant Info
                    </Button>
                  </SheetTrigger>
                  <SheetContent>
                    <SheetHeader>
                      <SheetTitle>Update Merchant profile</SheetTitle>
                      <SheetDescription>
                        Make changes to your profile here. Click save when you&apos;re done.
                      </SheetDescription>
                    </SheetHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                          Name
                        </Label>
                        <Input 
                        id="name" 
                        value={updateInfo.name}
                        placeholder={merchantInfo.name}
                        onChange={(e) => setUpdateInfo({ ...updateInfo, name: e.target.value })} 
                        className="col-span-3" 
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="phone_number" className="text-right">
                          Phone Number
                        </Label>
                        <Input 
                        id="phone_number" 
                        value={updateInfo.phone_number}
                        onChange={(e) => setUpdateInfo({ ...updateInfo, phone_number: e.target.value })}
                        className="col-span-3" 
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="business_category" className="text-right">
                          Business Category
                        </Label>
                        <Input 
                        id="business_category" 
                        value={updateInfo.business_category}
                        onChange={(e) => setUpdateInfo({ ...updateInfo, business_category: e.target.value })}
                        className="col-span-3" 
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="email" className="text-right">
                          Email
                        </Label>
                        <Input 
                        id="email" 
                        value={updateInfo.email}
                        onChange={(e) => setUpdateInfo({ ...updateInfo, email: e.target.value })}
                        className="col-span-3" 
                        />
                      </div>
                    </div>
                    <SheetFooter>
                      <SheetClose asChild>
                        <Button 
                        type="submit"
                        className="mt-2"
                        onClick={handleUpdateMerchantInfo}
                        >
                          Save changes
                        </Button>
                      </SheetClose>
                    </SheetFooter>
                  </SheetContent>
                </Sheet>

                <div className="w-4"></div> {/* Adding a space */}
                
                <Sheet>
                  <SheetTrigger asChild>
                    <Button className='flex px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring focus:border-green-300'>
                      Update Pincodes
                    </Button>
                  </SheetTrigger>
                  <SheetContent>
                    <SheetHeader>
                      <SheetTitle>Edit Pincode Serviceability</SheetTitle>
                      <SheetDescription>
                        Make changes to your pincode serviceability here. Click save when you&apos;re done.
                      </SheetDescription>
                    </SheetHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="pincodes" className="text-right">
                          Pincodes
                        </Label>
                        <Input 
                        id="pincodes" 
                        {...register('pincodes', { required: 'Pincodes field is required' })}
                        value={pincodesFormData.pincodes}
                        onChange={(e) => setPincodesFormData({ pincodes: e.target.value })}
                        className="col-span-3" 
                        />
                        {errors.pincodes && <p className="text-red-500">This field is required</p>}
                      </div>
                    </div>
                    <SheetFooter>
                      <SheetClose asChild>
                        <Button type="submit" className="mt-2" onClick={handleAddPincodes}>Add Pincodes</Button>
                      </SheetClose>
                      <SheetClose asChild>
                        <Button type="submit" className="mt-2" onClick={handleDeletePincodes}>Delete Pincodes</Button>
                      </SheetClose>
                    </SheetFooter>
                  </SheetContent>
                </Sheet>

              </CardFooter>
            </Card>
          </div> 

    </div>
  );
}

export default UpdateMerchant
