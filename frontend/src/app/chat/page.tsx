"use client";
import Loading from '@/components/Loading';
import { useAppData } from '@/context/AppContext';
import { useRouter } from 'next/dist/client/components/navigation';

import React, { useEffect } from 'react'

const ChatApp = () => {
  const {loading, isAuth} = useAppData();

  const router = useRouter();

  useEffect(()=>{
    if(!loading && !isAuth){
      router.push("/login")
    }
  }, [loading, isAuth, router]);

  if(loading) return <Loading />;
  return (
    <div>ChatApp</div>
  )
}

export default ChatApp