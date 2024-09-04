import React, { useState, useEffect } from 'react';
import {
  Modal,
  Backdrop,
  Fade,
} from '@mui/material';
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
import { Button } from '@/components/ui/button';
import axios from 'axios';
import NavBar from '@/components/NavBar';
import { Inter } from 'next/font/google';
import Footer from '@/components/Footer';


const inter = Inter({ subsets: ['latin'] });


interface Merchant {
  id: number;
  name: string;
}

interface MerchantsData {
  status: string;
  data: {
    merchants: Merchant[];
  };
}
const Merchants = () => {
  const [merchantsData, setMerchantsData] = useState<MerchantsData | null>(null);
  const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(null);
  const [openUpdateModal, setOpenUpdateModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);

  useEffect(() => {
    fetchMerchants();
  }, []);

  const fetchMerchants = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:8000/merchants');
      setMerchantsData(response.data);
    } catch (error) {
      console.error('Error fetching merchants data:', error);
    }
  };

  const handleUpdateClick = (merchant: Merchant) => {
    setSelectedMerchant(merchant);
    setOpenUpdateModal(true);
  };

  const handleDeleteClick = (merchant: Merchant) => {
    setSelectedMerchant(merchant);
    setOpenDeleteModal(true);
  };

  const handleUpdateMerchant = async () => {
    // Implement the logic to update the merchant
    console.log('Updating merchant:', selectedMerchant);
    setOpenUpdateModal(false);
  };

  const handleDeleteMerchant = async () => {
    try {
      await axios.delete(`http://127.0.0.1:8000/merchant/${selectedMerchant?.id}`);
      // Optionally, you can update the UI by refetching the updated merchant list
      fetchMerchants();
      setOpenDeleteModal(false);
    } catch (error) {
      console.error('Error deleting merchant:', error);
    }
  };

  const handleCloseUpdateModal = () => {
    setOpenUpdateModal(false);
    setSelectedMerchant(null);
  };

  const handleCloseDeleteModal = () => {
    setOpenDeleteModal(false);
    setSelectedMerchant(null);
  };

  return (
    <div>
      <NavBar />

      <main
        className={` p-24 ${inter.className}`}
      >
        <div className='h-5 mb-8'>
          <p className='text-2xl font-bold'>All Merchant Info</p>
        </div>

      {merchantsData && (
        <Table>
              {/* <TableCaption>A list of your recent invoices.</TableCaption> */}
              <TableHeader>
                <TableRow>
                <TableHead>Merchant Name</TableHead>
                <TableHead>Merchant ID</TableHead>
                <TableHead>Update Merchant</TableHead>
                <TableHead>Delete Merchant</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {merchantsData.data.merchants.map((merchant) => (
                <TableRow key={merchant.id}>
                  <TableCell>{merchant.name}</TableCell>
                  <TableCell>{merchant.id}</TableCell>
                  <TableCell>
                    <Button onClick={() => handleUpdateClick(merchant)} variant="outline">
                      Update
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Button onClick={() => handleDeleteClick(merchant)} variant="outline">
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
      )}

      {/* Update Merchant Modal */}
      <Modal
        open={openUpdateModal}
        onClose={handleCloseUpdateModal}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{ timeout: 500 }}
      >
        <Fade in={openUpdateModal}>
          <div>
            {/* Implement your logic for updating the merchant here */}
            <p>Updating Merchant: {selectedMerchant?.name}</p>
            <Button onClick={handleUpdateMerchant}  color="primary">
              Confirm Update
            </Button>
          </div>
        </Fade>
      </Modal>

      {/* Delete Merchant Modal */}
      <Modal
        open={openDeleteModal}
        onClose={handleCloseDeleteModal}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{ timeout: 500 }}
      >
        <Fade in={openDeleteModal}>
          <div>
            {/* Implement your logic for deleting the merchant here */}
            <p>Deleting Merchant: {selectedMerchant?.name}</p>
            <Button onClick={handleDeleteMerchant}  color="primary">
              Confirm Delete
            </Button>
          </div>
        </Fade>
      </Modal>

      </main>

      <Footer />

    </div>
  );
}

export default Merchants




