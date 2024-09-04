import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Inter } from 'next/font/google';
import axios from 'axios';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"


const inter = Inter({ subsets: ['latin'] });

interface ServiceabilityData {
  status: string;
  data: Record<string, { merchant_ids: number[] }>;
}

interface MerchantDetails {
  status: string;
  data: {
    business_category: string;
    email: string;
    id: number;
    name: string;
    phone_number: string;
    pincodes_serviced: string;
  };
}

const MerchantServiceability = () => {
  const [inputPincodes, setInputPincodes] = useState<string>('');
  const [serviceabilityData, setServiceabilityData] = useState<ServiceabilityData | null>(null);
  const [selectedMerchantId, setSelectedMerchantId] = useState<number | null>(null);
  const [merchantDetails, setMerchantDetails] = useState<MerchantDetails | null>(null);
  const [openModal, setOpenModal] = useState(false);

  useEffect(() => {
    if (selectedMerchantId !== null) {
      fetchMerchantDetails();
    }
  }, [selectedMerchantId]);

  const handleSearch = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:8000/merchant/serviceability', {
        params: {
          pincodes: inputPincodes,
        },
      });

      setServiceabilityData(response.data);
    } catch (error) {
      console.error('Error fetching serviceability data:', error);
    }
  };

  const handleRowClick = (merchantId: number) => {
    setSelectedMerchantId(merchantId);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedMerchantId(null);
    setMerchantDetails(null);
  };

  const fetchMerchantDetails = async () => {
    try {
      const response = await axios.get(`http://127.0.0.1:8000/merchant/${selectedMerchantId}`);

      setMerchantDetails(response.data);
    } catch (error) {
      console.error('Error fetching merchant details:', error);
    }
  };

  return (
    <div>
      <NavBar />

      <main
        className={` p-32 ${inter.className}`}
      >
        <div className='h-5 mb-8'>
          <p className='text-2xl font-bold'>Search Merchant Serviceability</p>
        </div>

        <div className='flex p-2 space-x-4'> </div>

        <div className='flex flex-row space-x-4'>
          <Input 
          placeholder="Enter Pincodes (comma-separated)"
          value={inputPincodes}
          onChange={(e) => setInputPincodes(e.target.value)} 
          />

          <Button  onClick={handleSearch}>
            Search
          </Button>

          <Button >
            Search Current Location
          </Button>
        </div>

        <div className='flex p-8 space-x-4'> </div>

        <div className='flex flex-row'>

          {serviceabilityData && (
            <Table>
              {/* <TableCaption>A list of your recent invoices.</TableCaption> */}
              <TableHeader>
                <TableRow>
                    <TableHead>Merchant ID</TableHead>
                    <TableHead>Pincode</TableHead>
                    <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(serviceabilityData.data).map(([pincode, { merchant_ids }]) =>
                  merchant_ids.map((merchantId) => (
                    <TableRow key={merchantId}>
                      <TableCell>{merchantId}</TableCell>
                      <TableCell>{pincode}</TableCell>
                      <TableCell>
                        <Button onClick={() => handleRowClick(merchantId)} variant="outline">
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}

        </div>

        </main>


        <Dialog 
        open={openModal}
        onOpenChange={handleCloseModal}
        >
        {merchantDetails && (
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Merchant Details</DialogTitle>
            <DialogDescription>
              Merchant details for Merchant Id {selectedMerchantId}
            </DialogDescription>
          </DialogHeader>
          <Separator className="my-2" />
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">
                Name
              </Label>
              <Separator orientation="vertical" />
              <Label className="text-right">
                {merchantDetails.data.name}
              </Label>
            </div>
            <Separator className="my-1" />
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">
                Business Category
              </Label>
              <Separator orientation="vertical" />
              <Label className="text-right">
                {merchantDetails.data.business_category}
              </Label>
            </div>
            <Separator className="my-1" />
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">
                Email
              </Label>
              <Separator orientation="vertical" />
              <Label className="text-right">
                {merchantDetails.data.email}
              </Label>
            </div>
            <Separator className="my-1" />
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">
                Phone Number
              </Label>
              <Separator orientation="vertical" />
              <Label className="text-right">
                {merchantDetails.data.phone_number}
              </Label>
            </div>
            <Separator className="my-1" />
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">
                Pincodes Serviced
              </Label>
              <Separator orientation="vertical" />
              <Label className="text-right">
                {merchantDetails.data.pincodes_serviced}
              </Label>
            </div>
          </div>
        </DialogContent>
        )}
      </Dialog>


      <Footer />
    </div>
  );
};

export default MerchantServiceability