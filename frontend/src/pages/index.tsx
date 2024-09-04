import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Inter } from 'next/font/google';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import { useForm, SubmitHandler } from 'react-hook-form';
import axios from 'axios';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Select, SelectTrigger, SelectItem, SelectValue, SelectContent } from '@/components/ui/select';

import CodeMirror from "@uiw/react-codemirror";
import { json } from "@codemirror/lang-json";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";


import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

type Inputs = {
  name: string;
  business_category: string;
  phone_number: string;
  email: string;
  pincodes: string;
};

const inter = Inter({ subsets: ['latin'] });

interface MyJsonType {
  name: string;
  business_category: string;
  contact: {
    phone_number: string;
    email: string;
  };
  pincodes_serviced: string[];
}

const merchantJsonObject: {
    name: string;
    id: number;
    business_category: string;
    contact: {
        phone_number: string;
        email: string;
    };
    pincodes_serviced: string[];
} = {
    name: "Merchant_name",
    id: 0,
    business_category: "Merchant_business_category",
    contact: {
        phone_number: "9999999999",
        email: "example@example.com",
    },
    pincodes_serviced: ["110008", "110009", "110001"],
};

export default function Home() {
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<Inputs>();

  const [alertOpen, setAlertOpen] = useState(false);
  const [alertType, setAlertType] = useState<'success' | 'error'>('success');
  const [alertMessage, setAlertMessage] = useState('');
  const [merchantJsonData, setMerchantJsonData] = useState(JSON.stringify(merchantJsonObject, null, 2));

  const [file, setFile] = useState(null);

  const handleFileChange = (event: any) => {
    console.log(event);
    setFile(event.target.files[0]);
  };

  const handleFileSubmit = async (event: any) => {
    event.preventDefault(); // Prevent the default form submission

    if (!file) {
      console.error('No file selected');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('upload', file);

      const response = await axios.post('http://127.0.0.1:8000/upload_csv', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('Response:', response.data);
      console.log('Calling toast')
      toast({
        title: 'Merchants Onboarded Successfully',
        description: "\nMerchant Ids are " + response.data.data.merchant_ids,
        // status: 'success',
      });

    } catch (error) {
      console.error('Error:', error);
      // Handle errors here
      toast({
        title: 'Error Onboarding Merchants',
        variant: "destructive",
        description: 'Failed to submit. Please try again.',
        // status: 'error',
      });
    }
  };

  const handleJsonChange = React.useCallback((value: any, viewUpdate: any) => {
    setMerchantJsonData(value);
    console.log('JSON Value:', value);
  }, []);


 const handleSendRequest: SubmitHandler<Inputs> = async (newJson) => {
    // console.log(newJson);
    // console.log(merchantJsonData);
    const merchantJsonValue = JSON.parse(merchantJsonData);
    console.log(merchantJsonValue);

    try {
      // Send a POST request using Axios
      console.log("Sending request to server");
      const response = await axios.post('http://127.0.0.1:8000/merchant', merchantJsonValue, {
        headers: {'Content-Type': 'application/json',},
      });

      console.log('Server response:', response.data);
      console.log('Calling toast')
      toast({
        title: 'Merchant Onboarded Successfully',
        description: "\nMerchant Id is " + response.data.data.ONDC_merchant_id,
        // status: 'success',
      });
    } catch (error) {
      // Handle errors, log them, or show an error message to the user
      console.error('Error sending POST request:', error);

      toast({
        title: 'Error Onboarding Merchant',
        variant: "destructive",
        description: 'Failed to submit. Please try again.',
        // status: 'error',
      });
    }
  };

  const handleAlertClose = () => {
    setAlertOpen(false);
  };

  const onSubmit: SubmitHandler<Inputs> = async (data) => {
    const jsonData = parseFormDataToJSON(data);
    console.log(jsonData);

    try {
      // Send a POST request using Axios
      console.log("Sending request to server");
      const response = await axios.post('http://127.0.0.1:8000/merchant', jsonData, {
        headers: {'Content-Type': 'application/json',},
      });

      console.log('Server response:', response.data);
      console.log('Calling toast')
      toast({
        title: 'Merchant Onboarded Successfully',
        description: "\nMerchant Id is " + response.data.data.ONDC_merchant_id,
        // status: 'success',
      });
    } catch (error) {
      // Handle errors, log them, or show an error message to the user
      console.error('Error sending POST request:', error);

      toast({
        title: 'Error Onboarding Merchant',
        variant: "destructive",
        description: 'Failed to submit. Please try again.',
        // status: 'error',
      });
    }
  };

  const parseFormDataToJSON = (formData: Inputs): any => {
    // Extract values from form data
    const { name, business_category, phone_number, email, pincodes } = formData;

    const jsonData = {
      name,
      id: 0, // Assuming "id" is always 0 for new entries
      business_category,
      contact: {
        phone_number,
        email,
      },
      pincodes_serviced: pincodes ? pincodes.split(',').map((code) => code.trim()) : [],
    };

    return jsonData;
  };

  return (
    <div>
      <NavBar />

      <main
        className={`flex min-h-screen items-center justify-center p-24 ${inter.className}`}
      >
        <div className='flex flex-col'>

          <div className='flex flex-col p-4 space-x-4'>
            <Tabs defaultValue="account" >
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="account">Form Onboarding</TabsTrigger>
                <TabsTrigger value="json-onboard">Json Onboarding</TabsTrigger>
                <TabsTrigger value="csv-onboard">CSV Onboarding</TabsTrigger>
              </TabsList>
            <TabsContent value="account">
            <Card>
              <form
                onSubmit={handleSubmit(onSubmit)}
                >
              <CardHeader>
                <CardTitle>Merchant Onboarding</CardTitle>
                <CardDescription>Onboarding Merchant with Pincode Serviceability</CardDescription>
              </CardHeader>
              <CardContent>
                
                  <div className="grid w-full items-center gap-4">
                    <div className="flex flex-col space-y-1.5">
                      <Label htmlFor="name">Name</Label>
                      <Input {...register('name')} id="name" placeholder="Name of the Merchant" />
                    </div>
                    <div className="flex flex-col space-y-1.5">
                      <Label htmlFor="business_category">Business Category</Label>
                      <Input {...register('business_category')} id="business_category" placeholder="Business Category of the Merchant" />
                    </div>
                    <div className="flex flex-col space-y-1.5">
                      <Label htmlFor="phone_number">Phone Number</Label>
                      <Input {...register('phone_number')} id="phone_number" placeholder="Phone Number of the Merchant" />
                    </div>
                    <div className="flex flex-col space-y-1.5">
                      <Label htmlFor="email">Email</Label>
                      <Input {...register('email')} id="email" placeholder="Email id of the Merchant" />
                    </div>
                    <div className="flex flex-col space-y-1.5">
                      <Label htmlFor="pincodes">Pincodes</Label>
                      <Input {...register('pincodes')} id="pincodes" placeholder="Pincodes Serviced" />
                    </div>
                  </div>
                
              </CardContent>
              <CardFooter>
                <Button
                type='submit'
              >
                Submit
              </Button>
              </CardFooter>
              </form>
            </Card>
            </TabsContent>
            <TabsContent value="json-onboard">
              <Card>
              <form
                onSubmit={handleSubmit(handleSendRequest)}
                >
              <CardHeader>
                <CardTitle>Merchant Onboarding</CardTitle>
                <CardDescription>Json format for merchant onboarding</CardDescription>
              </CardHeader>
              <CardContent>
                
                  <CodeMirror
                    value={merchantJsonData}
                    height="400px"
                    theme="dark"
                    extensions={[json()]}
                    onChange={handleJsonChange}
                  />
                
              </CardContent>
              <CardFooter>
                <Button
                type='submit'
              >
                Submit
              </Button>
              </CardFooter>
              </form>
            </Card>
            </TabsContent>
            <TabsContent value="csv-onboard">
            <Card>
              <form onSubmit={handleFileSubmit}>
              <CardHeader>
                <CardTitle>Merchant Onboarding</CardTitle>
                <CardDescription>CSV File for bulk merchant onboarding</CardDescription>
              </CardHeader>
              <CardContent>
                
                  <div className="grid w-full items-center gap-4">
                    <div className="flex flex-col space-y-1.5">
                      <Label htmlFor="csv">CSV File</Label>
                      <Input id="csv" type="file" onChange={handleFileChange} />
                    </div>

                  </div>
                
              </CardContent>
              <CardFooter>
                <Button
                type='submit'
              >
                Submit
              </Button>
              </CardFooter>
              </form>
            </Card>
            </TabsContent>

            </Tabs>
          </div> 

        </div>
      </main>

      <Footer />

      <Toaster />
    </div>
  );
}
