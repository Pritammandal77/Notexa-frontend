"use client";

import { CircleX, LogOut, TableOfContents, X } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import Login from "./Login";
import { useDispatch, useSelector } from "react-redux";
import Image from "next/image";
import { logOutUser } from "@/utils/userApi";
import { toast } from "sonner";
import Loader1 from "./Loader/Loader1.jsx/Loader1";
import { fetchWithAuth } from "@/utils/auth";
import { fetchAllNotes } from "@/utils/notesApi";
import { setAllNotes } from "@/redux/slices/notesSlice";
import { setCurrUser } from "@/redux/slices/userSlice";

function Header() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const user = useSelector((state) => state.user?.currUser?.user);
    const [isLoading, setIsLoading] = useState(false);

    const handleLogout = async () => {
        try {
            setIsLoading(true);
            await logOutUser();
            setIsLoading(false);
        } catch (error) {
            toast.error("Log out failed");
        }
    };

    const [userData, setUserData] = useState()
    useEffect(() => {
        async function getUser() {
            const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/me`);
            if (res.ok) {
                const data = await res.json();
                setUserData(data);
            } else {
                console.log("Failed to fetch user");
            }
        }
        getUser();
    }, []);

    const dispatch = useDispatch();
    useEffect(() => {
        if (userData) {
            dispatch(setCurrUser(userData));
        }
    }, [userData, dispatch]);

    useEffect(() => {
        async function getAllNotes() {
            let allNotes = await fetchAllNotes();
            dispatch(setAllNotes(allNotes.data))
        }
        getAllNotes();
    }, [userData]);


    return (
        <>
            <header className="fixed top-0 left-0 z-50 h-16 w-[100vw] text-[18px] bg-white border-b border-gray-200 shadow-sm flex items-center justify-between px-5 md:px-20 overflow-x-hidden">
                <div className="font-bold text-[24px]">Notexa</div>

                <div className="hidden xl:flex items-center gap-10">
                    <Link href="/" className="font-semibold cursor-pointer">Home</Link>
                    <Link href="/allnotes" className="font-semibold cursor-pointer">Notes</Link>
                    {
                        user &&
                        <Link href="/profile" className="font-semibold cursor-pointer">Profile</Link>
                    }
                    {
                        user?.role == "admin" &&
                        <Link href="/payout-requests" className="font-semibold cursor-pointer">Admin</Link>
                    }
                    <Link href="/about" className="font-semibold cursor-pointer">About</Link>
                    <Link href="/support" className="font-semibold cursor-pointer">Support</Link>
                    <span
                        className="font-semibold cursor-pointer"
                        onClick={() => setIsDialogOpen(!isDialogOpen)}
                    >
                        <Image
                            src={user?.profilePicture || "/defaultpfp.webp"}
                            alt="User Profile"
                            height={40}
                            width={40}
                            className="rounded-full"
                        />
                    </span>
                </div>

                <div
                    className="xl:hidden font-bold cursor-pointer"
                    onClick={() => setIsSidebarOpen(true)}
                >
                    <TableOfContents size={28} />
                </div>
            </header>

            {/* ✅ Mobile Sidebar Overlay */}
            <div
                className={`w-[100vw] fixed right-0 top-0 inset-0 z-50 transition-all duration-500 ease-in-out overflow-x-hidden ${isSidebarOpen
                    ? "translate-x-0 bg-black/40 backdrop-blur-sm pointer-events-auto"
                    : "translate-x-full bg-transparent pointer-events-none"
                    }`}
                onClick={() => setIsSidebarOpen(false)}
            >
                {/* ✅ Sidebar Panel */}
                <aside
                    className={`absolute top-0 right-0 h-full w-[75vw] max-w-xs sm:w-[50vw] bg-orange-50 shadow-xl border-l border-gray-200 transform transition-transform duration-500 ease-in-out ${isSidebarOpen ? "translate-x-0" : "translate-x-full"
                        }`}
                    onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside
                >
                    {/* Header of Sidebar */}
                    <div className="flex items-center justify-between p-5 border-b border-gray-200">
                        <h2 className="font-bold text-xl">Menu</h2>
                        <X
                            className="cursor-pointer text-gray-600 hover:text-black transition"
                            onClick={() => setIsSidebarOpen(false)}
                        />
                    </div>

                    {/* Menu Links */}
                    <ul className="flex flex-col gap-6 mt-6 pl-4 pr-2 text-lg font-semibold text-gray-800">
                        {
                            user ?
                                (
                                    <div
                                        className="font-semibold cursor-pointer flex gap-2"
                                        onClick={() => {
                                            setIsDialogOpen(!isDialogOpen)
                                            setIsSidebarOpen(false)
                                        }}

                                    >
                                        <Image
                                            src={user?.profilePicture || "/defaultpfp.webp"}
                                            alt="User Profile"
                                            height="40"
                                            width="40"
                                            className="rounded-full"
                                        />
                                        <div>
                                            <p className="text-[16px]">{user?.fullName}</p>
                                            <p className="text-[12px]">{user?.email}</p>
                                        </div>
                                    </div>
                                ) :
                                (
                                    // <button className="bg-orange-500 py-2 text-white font-semibold rounded-2xl">continue with google</button>
                                    <Login />
                                )
                        }

                        <li>
                            <Link href="/" onClick={() => setIsSidebarOpen(false)}>Home</Link>
                        </li>
                        {
                            user &&
                            <li>
                                <Link href="/profile" onClick={() => setIsSidebarOpen(false)}>Profile</Link>
                            </li>
                        }
                        <li>
                            <Link href="/allnotes" onClick={() => setIsSidebarOpen(false)}>Notes</Link>
                        </li>
                        {
                            user &&
                            <li>
                                <Link href="/sellnotes" onClick={() => setIsSidebarOpen(false)}>Sell Notes</Link>
                            </li>
                        }
                        <li>
                            <Link href="/about" onClick={() => setIsSidebarOpen(false)}>About</Link>
                        </li>
                        <Link href="/support" onClick={() => setIsSidebarOpen(false)} className="font-semibold cursor-pointer">Support</Link>
                        {
                            user?.role == "admin" &&
                            <Link href="/payout-requests" className="font-semibold cursor-pointer"
                                onClick={() => setIsSidebarOpen(false)}>
                                Admin
                            </Link>
                        }
                    </ul>

                    {
                        user &&
                        <p className="flex gap-2 absolute bottom-5 right-5 text-[16px text-gray-600]"
                            onClick={logOutUser}>
                            <LogOut />
                            Logout
                        </p>

                    }
                </aside>
            </div>


            <div
                className={`fixed flex flex-col items-center justify-center gap-7 top-20 right-5 xl:right-10 h-40 w-[90vw] md:w-100 bg-orange-100 border border-orange-200 z-30 rounded-lg shadow-lg p-4 transition-all duration-300 ease-out 
        ${isDialogOpen
                        ? "opacity-100 translate-y-0"
                        : "opacity-0 -translate-y-5 pointer-events-none"
                    }`}
            >
                {user ? (
                    <div className="w-full h-full relative">
                        <div className="flex items-center gap-5">
                            <Image
                                src={user?.profilePicture}
                                alt="User image"
                                width={70}
                                height={70}
                                className="rounded-full"
                            />
                            <div>
                                <p className="font-semibold">{user.fullName}</p>
                                <p>{user.email}</p>
                            </div>
                        </div>

                        <CircleX
                            className="absolute top-3 right-3 cursor-pointer"
                            onClick={() => setIsDialogOpen(false)}
                        />
                        <button
                            className="bg-orange-500 text-white font-semibold cursor-pointer text-[15px] px-3 py-1 rounded-xl absolute bottom-0 right-0"
                            onClick={handleLogout}
                        >
                            Log Out
                        </button>
                    </div>
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-6">
                        <h1 className="text-2xl font-bold">Login now</h1>
                        <Login />
                        <CircleX
                            className="absolute top-3 right-3 cursor-pointer"
                            onClick={() => setIsDialogOpen(false)}
                        />
                    </div>
                )}
            </div>

            {
                isLoading &&
                <div className="h-screen w-full z-30 backdrop-blur-xs absolute top-0 right-0 flex items-center justify-center">
                    <Loader1 />
                </div>
            }
        </>
    );
}

export default Header;
