import { useRouter } from 'next/router';
import UpdateMerchant from '@/components/UpdateMerchant';
import NavBar from '@/components/NavBar';
import { Toaster } from "@/components/ui/toaster"


const MerchantPage = () => {
  const router = useRouter();
  const { id } = router.query ;

  // Pass the merchantId as a prop to your component
  return (
    <div>
      <NavBar />
      <UpdateMerchant id={id} />
      <Toaster />
    </div>
  );
}

export default MerchantPage;