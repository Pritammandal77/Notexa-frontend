"use client";
import React, { useEffect, useState } from "react";
import { countNotesViews, fetchReviewsById, getNotesById, UpdateNotesDownloadsCount } from "@/utils/notesApi";
import { useParams } from "next/navigation";
import {
    Download,
    Eye,
    FileText,
    Calendar,
    Star,
    ChevronLeft,
    ChevronRight,
    Ellipsis,
} from "lucide-react";
import { useSelector } from "react-redux";
import { toast } from "sonner";
import { axiosInstance } from "@/utils/axiosInstance";
import NotesDetailsPageSkeleton from "@/components/SkeletonLoaders/NotesDetailsPageSkeleton";
import ReviewModal from "@/components/ui/ReviewModal";
import Image from "next/image";
import { formatDate } from "@/utils/FormatDate";
import { IconStarFilled, IconStarsFilled } from "@tabler/icons-react";
import { addNotesToPurchased } from "@/utils/userApi";
import { deleteReview } from "@/utils/reviewApi";
import Link from "next/link";
import { createNewTransaction } from "@/utils/payoutApi";


function Page() {
    const { id } = useParams();
    const [notesData, setNotesData] = useState(null);
    const user = useSelector((state) => state.user?.currUser?.user)
    const userId = user?._id;
    const [showReview, setShowReview] = useState(false);
    const [currentSlide, setCurrentSlide] = React.useState(0);
    const [Allreviews, setAllReviews] = useState(null);
    const [isThisNotesPurchasedByCurrUser, setIsThisNotesPurchasedByCurrUser] = useState(false)
    const [openDropdownId, setOpenDropdownId] = useState(null);

    const nextSlide = () => {
        setCurrentSlide((prev) => (prev === 1 ? 0 : prev + 1));
    };

    const prevSlide = () => {
        setCurrentSlide((prev) => (prev === 0 ? 1 : prev - 1));
    };

    // Auto slide every 3s
    useEffect(() => {
        const interval = setInterval(() => {
            nextSlide();
        }, 3000);

        return () => clearInterval(interval);
    }, []);


    useEffect(() => {
        if (user) {
            let isNotesPurchasedByUser = user.notesPurchased.find((ids) => ids == id)

            if (isNotesPurchasedByUser != undefined) {
                setIsThisNotesPurchasedByCurrUser(true)
            }
        }
    }, [user]);

    useEffect(() => {
        async function fetchNote() {
            const res = await getNotesById(id);
            setNotesData(res?.data);
            countNotesViews(id);
        }
        fetchNote();
    }, [id]);

    useEffect(() => {
        async function HandleFetchReviews() {
            const reviews = await fetchReviewsById(id)
            setAllReviews(reviews)
        }
        HandleFetchReviews();
    }, []);


    if (!notesData)
        return (
            <NotesDetailsPageSkeleton />
        );

    const {
        title,
        description,
        subject,
        className,
        notesSample1,
        notesSample2,
        notesUrl,
        pagesCount,
        price,
        totalDownloads,
        viewsCount,
        createdAt,
        seller,
        reviews,
    } = notesData;

    const handleDownload = () => {
        window.open(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/notes/download/${id}`, "_blank");
    };

    const openPaymentPopup = () => {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        document.body.appendChild(script);

        return () => {
            document.body.removeChild(script);
        };
    }

    const handlePaymentForBuyingNotes = async () => {
        if (!user) {
            toast.error("Please Login to continue...")
            return
        }

        openPaymentPopup();

        try {
            const { data } = await axiosInstance.post(
                "/api/v1/payments/create-order-buynotes",
                { userId }
            );

            const order = data.order;

            if (!window.Razorpay) {
                toast.error("Razorpay SDK failed to load. Refresh the page.");
                return;
            }

            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                amount: order.amount,
                currency: order.currency,
                name: "Notexa Notes Upload",
                description: "Pay ₹29 to buy this notes",
                order_id: order.id,

                handler: async function (response) {
                    const verify = await axiosInstance.post(
                        "/api/v1/payments/verify-payment",
                        {
                            ...response,
                            userId,
                        }
                    );

                    const paymentId = response.razorpay_payment_id

                    if (verify.data.success) {
                        toast.success("Payment Verified!");
                        handleDownload();
                        UpdateNotesDownloadsCount(id);
                        addNotesToPurchased(id);
                        createNewTransaction(id, paymentId)
                    } else {
                        toast.error("Payment failed!");
                    }
                },

                theme: { color: "#ff8800" },
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (error) {
            console.log(error);
            toast.error("Error starting payment");
        }
    }

    const handleDeleteReview = async (id) => {
        const res = await deleteReview(id)
    }

    return (
        <div className="min-h-screen h-auto bg-gradient-to-br from-orange-50 via-white to-orange-100 pt-24 pb-16 px-0 md:px-20 xl:px-0">

            {/* TOP HEADER */}
            <div className="max-w-7xl mx-auto xl:mb-10 px-3 xl:px-0 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div>
                    <h1 className="text-4xl font-bold text-gray-900 drop-shadow-sm">
                        {title}
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">
                        {subject} • Class {className}
                    </p>
                </div>
                {
                    isThisNotesPurchasedByCurrUser ?
                        <button
                            onClick={handleDownload}
                            className="sticky top-30 flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 transition px-6 py-3 rounded-xl text-white shadow-lg w-full sm:w-auto"
                        >
                            <Download size={18} />
                            Download Notes
                        </button>
                        :
                        <button
                            onClick={handlePaymentForBuyingNotes}
                            className="sticky top-30 flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 transition px-6 py-3 rounded-xl text-white shadow-lg w-full sm:w-auto"
                        >
                            <Download size={18} />
                            Get this note
                        </button>
                }
            </div>

            {/* 3 TOP BOXES */}
            <div className="max-w-7xl h-auto xl:h-[400px] mx-auto grid grid-cols-1 xl:grid-cols-3 gap-8 items-start p-3 ">

                {/* 1️⃣ SELLER + BUY BOX */}
                <div
                    className="order-2 xl:order-1 bg-white/80 h-full backdrop-blur-xl border border-orange-200 shadow-xl rounded-2xl p-4 xl:p-6"
                >
                    <div className="flex items-center gap-4 pb-4 border-b border-orange-100">
                        <Link href={`/profile/${seller._id}`}>
                            <img
                                src={seller?.profilePicture}
                                alt={seller.fullName}
                                className="w-16 h-16 rounded-full object-cover border-2 border-orange-400 shadow-md"
                            />
                        </Link>
                        <div>
                            <p className="font-bold text-gray-800">{seller.fullName}</p>
                            <p className="text-sm text-gray-500">{seller.email}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-700 py-6">
                        <div className="flex items-center gap-2">
                            <FileText className="text-orange-500 w-4 h-4" />
                            {pagesCount} pages
                        </div>
                        <div className="flex items-center gap-2">
                            <Eye className="text-orange-500 w-4 h-4" />
                            {viewsCount?.length} views
                        </div>
                        <div className="flex items-center gap-2">
                            <Download className="text-orange-500 w-4 h-4" />
                            {totalDownloads?.length} downloads
                        </div>
                        <div className="flex items-center gap-2">
                            <Calendar className="text-orange-500 w-4 h-4" />
                            {formatDate(createdAt)}
                        </div>
                    </div>

                    <div className="bg-orange-50 border border-orange-200 rounded-xl p-5 shadow-inner">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-700 font-medium">Price</span>
                            <span className="text-3xl font-bold text-orange-600">₹{price}</span>
                        </div>

                        {
                            isThisNotesPurchasedByCurrUser ?
                                <button
                                    onClick={handleDownload}
                                    className="w-full mt-5 py-3 rounded-xl bg-orange-500 text-white font-semibold shadow-md hover:bg-orange-600 transition"
                                >
                                    Download Notes
                                </button>
                                :
                                <button
                                    onClick={handlePaymentForBuyingNotes}
                                    className="w-full mt-5 py-3 rounded-xl bg-orange-500 text-white font-semibold shadow-md hover:bg-orange-600 transition"
                                >
                                    Get This Note
                                </button>
                        }

                    </div>

                    <div
                        className="mt-5 p-1 pb-5 flex flex-col xl:hidden rounded-2xl xl:shadow-xl xl:border xl:border-orange-100"
                    >
                        <h2 className="text-2xl font-semibold text-gray-800 mb-4">About This Note</h2>
                        <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                            {description}
                        </p>
                    </div>
                </div>

                <div className="order-1 xl:order-2 relative bg-white/70 h-[400px] rounded-2xl shadow-lg border border-orange-200 p-4 backdrop-blur-xl overflow-hidden xl:col-span-2">

                    <div
                        className="w-full h-full flex transition-transform duration-700"
                        style={{
                            transform: `translateX(-${currentSlide * 100}%)`,
                        }}
                    >
                        <div className="min-w-full h-[360px] bg-orange-50 rounded-xl flex items-center justify-center overflow-hidden shadow-inner">
                            <img
                                src={notesSample1}
                                alt="Sample 1"
                                className="w-full h-full object-contain"
                            />
                        </div>

                        <div className="min-w-full h-[360px] bg-orange-50 rounded-xl flex items-center justify-center overflow-hidden shadow-inner">
                            <img
                                src={notesSample2}
                                alt="Sample 2"
                                className="w-full h-full object-contain"
                            />
                        </div>
                    </div>

                    <button
                        onClick={prevSlide}
                        className="absolute left-1 xl:lef-3 top-1/2 -translate-y-1/2 bg-orange-200 hover:bg-orange-400 p-2 rounded-full shadow cursor-pointer"
                    >
                        <ChevronLeft />
                    </button>

                    <button
                        onClick={nextSlide}
                        className="absolute right-1 xl:right-3 top-1/2 -translate-y-1/2 bg-orange-200 hover:bg-orange-400 p-2 rounded-full shadow cursor-pointer"
                    >
                        <ChevronRight />
                    </button>
                </div>

            </div>

            {/* 2 BOTTOM BOXES */}
           <div className="max-w-7xl relative mx-auto grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-5 xl:gap-10 mt-5 xl:mt-14 p-3 xl:p-0 items-start">

                <div
                    className="bg-white hidden h-auto xl:inline rounded-2xl xl:shadow-xl xl:border xl:border-orange-200 p-8"
                >
                    <h2 className="text-2xl font-semibold text-gray-800 mb-4">About This Note</h2>
                    <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                        {description}
                    </p>
                </div>

                <div
                    className="bg-white h-auto rounded-2xl shadow-xl border border-orange-200 xl:border-orange-200 p-8"
                >
                    <h2 className="font-semibold text-gray-800 mb-6 flex items-center justify-between gap-2">
                        <div className="text-2xl flex items-center justify-center gap-2">
                            <Star className="text-orange-500 w-5 h-5" />
                            Reviews
                        </div>

                        {
                            isThisNotesPurchasedByCurrUser &&
                            <div>
                                <button className="bg-orange-500 hover:bg-orange-600 px-3 py-2 text-white font-semibold rounded-2xl cursor-pointer"
                                    onClick={() => setShowReview(true)}>
                                    Add Review
                                </button>
                            </div>
                        }

                    </h2>

                    {Allreviews?.length === 0 ? (
                        <p className="text-gray-400 text-sm">No reviews yet.</p>
                    ) : (
                        <div className="space-y-5 xl:max-h-100 overflow-y-scroll bg-green-400">
                            {Allreviews?.map((review, index) => (
                                <div
                                    key={index}
                                    className="flex justify-between gap-4 relative border-1 bg-orange-50 border-orange-200 pb-4 p-2 md:p-3 xl:p-4 rounded-2xl"
                                >
                                    <div className="min-w-0 flex-1">
                                        <div className="flex gap-3">
                                            <Image
                                                src={review?.user?.profilePicture}
                                                alt="failed to load the image"
                                                height={50}
                                                width={50}
                                                className="rounded-full"
                                            />
                                            <div className="relative">
                                                <p className="font-medium text-gray-800">
                                                    {review.user.fullName}
                                                </p>
                                                <div className="flex gap-1">
                                                    {Array.from({ length: 5 }).map((_, i) => (
                                                        <span
                                                            key={i}
                                                            className={i < review.rating ? "text-orange-500" : "text-gray-400"}
                                                        >
                                                            <IconStarFilled size={18} />
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-700 mt-3 font-semibold">{review.reviewMessage}</p>
                                    </div>

                                    <span className="text-xs text-gray-500 ml-2 absolute bottom-2 right-2">{formatDate(review.createdAt)}</span>

                                    <div className='absolute top-2 right-2 flex flex-col'>
                                        <Ellipsis
                                            className='cursor-pointer self-end'
                                            onClick={() => setOpenDropdownId(openDropdownId === review._id ? null : review._id)}
                                        />

                                        {openDropdownId === review._id && (
                                            <ul className='bg-orange-100 rounded-2xl'>
                                                <li className='border-1 p-2 rounded-xl border-orange-300 hover:bg-orange-200 cursor-pointer'
                                                    onClick={() => handleDeleteReview(review._id)}
                                                >Delete Review
                                                </li>

                                            </ul>
                                        )}
                                    </div>

                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>

            <ReviewModal
                open={showReview}
                onClose={() => setShowReview(false)}
                notesId={id}
            />

        </div>
    );
}

export default Page;
