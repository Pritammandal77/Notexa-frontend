"use client";
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight, Search, Zap, BookOpenText } from 'lucide-react';

import NotesCardSkeleton from '@/components/SkeletonLoaders/NotesCardSkeleton';
import NotesCard from '@/components/ui/NotesCard';
import { deleteNotes, getSearchedNotes } from '@/utils/notesApi';

const bannerSlides = [
    {
        title: "Find Exactly What You Need",
        subtitle: "Every note is tagged by subject, so you can spot the right one in seconds.",
        cta: "Browse Notes",
        href: "#all-notes",
        image: "https://images.unsplash.com/photo-1741699428220-65f37f3fbbcb?auto=format&fit=crop&w=1600&q=80"
    },
    {
        title: "Not Sure It's Right? Ask First.",
        subtitle: "Chat with our AI about any note's content before you spend a single rupee.",
        cta: "Try AI Chat",
        href: "#all-notes", // TODO: point this to your actual per-note AI chat route once that flow is final
        image: "https://images.unsplash.com/photo-1758270705290-62b6294dd044?auto=format&fit=crop&w=1600&q=80"
    },
    {
        title: "Turn Your Notes Into Income",
        subtitle: "Upload your best notes and keep 70% of every sale, paid out per download.",
        cta: "Start Selling",
        href: "/sellnotes",
        image: "https://images.unsplash.com/photo-1735825764460-c5dec05d6253?auto=format&fit=crop&w=1600&q=80"
    }
];

const categories = [
    "All",
    "Computer Science",
    "Mathematics",
    "Physics",
    "Biology",
    "Commerce",
    "Programming",
    "Web Development",
    "AI",
    "Entrance Preparation",
    "School",
    "Others"
];

function Page() {

    const [currentNotes, setCurrentNotes] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const [searchText, setSearchText] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [selectedCategory, setselectedCategory] = useState("All");

    const [currentSlide, setCurrentSlide] = useState(0);
    const [direction, setDirection] = useState(1);
    const [isHovered, setIsHovered] = useState(false);

    // guards against a slower, older request overwriting a newer one
    const requestIdRef = useRef(0);

    // debounce: only update debouncedSearch 400ms after the user stops typing
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchText);
        }, 400);
        return () => clearTimeout(timer);
    }, [searchText]);

    const fetchFilteredNotes = useCallback(async () => {
        const requestId = ++requestIdRef.current;
        setIsLoading(true);
        try {
            const params = { notes: debouncedSearch };
            // omit "subject" entirely for "All" — sending it literally
            // makes the backend search for subject === "All"
            if (selectedCategory !== "All") {
                // Converts "Web Development" -> "web-development"
                params.category = selectedCategory.toLowerCase().replace(/\s+/g, '-');
            }
            const results = await getSearchedNotes(params);
            if (requestId === requestIdRef.current) {
                setCurrentNotes(results);
            }
        } catch (error) {
            if (requestId === requestIdRef.current) {
                toast.error("Failed to load notes. Please refresh.");
            }
        } finally {
            if (requestId === requestIdRef.current) {
                setIsLoading(false);
            }
        }
    }, [debouncedSearch, selectedCategory]);

    useEffect(() => {
        fetchFilteredNotes();
    }, [fetchFilteredNotes]);



    useEffect(() => {
        if (isHovered) return;
        const timer = setInterval(() => { 
            setDirection(1);
            setCurrentSlide((prev) => (prev + 1) % bannerSlides.length);
        }, 4500);
        return () => clearInterval(timer);
    }, [isHovered]);

    const goToSlide = (index) => {
        setDirection(index > currentSlide ? 1 : -1);
        setCurrentSlide(index);
    };

    const goToPrev = () => {
        setDirection(-1);
        setCurrentSlide((prev) => (prev - 1 + bannerSlides.length) % bannerSlides.length);
    };

    const goToNext = () => {
        setDirection(1);
        setCurrentSlide((prev) => (prev + 1) % bannerSlides.length);
    };

    
    const handleDeleteNotes = async (notesId) => {
        try {
            await deleteNotes(notesId);
            fetchFilteredNotes();
            toast.success("Notes deleted successfully");
        } catch (error) {
            console.error("Error while deleting notes:", error);
            toast.error("Something went wrong while deleting the notes");
        }
    };
   
    return (
        <div className='w-full min-h-screen py-20 px-2 xl:px-6'>

            {/* Banner Carousel */}
            <div
                className='relative w-full h-64 sm:h-72 md:h-80 rounded-[2rem] overflow-hidden mb-12 shadow-2xl group'
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <AnimatePresence mode="wait" custom={direction}>
                    <motion.div
                        key={currentSlide}
                        custom={direction}
                        initial={{ opacity: 0, x: direction * 60 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -direction * 60 }}
                        transition={{ duration: 0.5, ease: "easeInOut" }}
                        className='absolute inset-0'
                    >
                        <div
                            className='absolute inset-0 bg-cover bg-center'
                            style={{ backgroundImage: `url(${bannerSlides[currentSlide].image})` }}
                        />
                        <div className='absolute inset-0 bg-gradient-to-r from-black/85 via-black/40 to-transparent' />

                        <div className='relative h-full flex items-center px-8 md:px-14'>
                            <div className='max-w-lg'>
                                <h2 className='text-3xl md:text-4xl font-extrabold font-playfair text-white mb-3 leading-tight tracking-tight'>
                                    {bannerSlides[currentSlide].title}
                                </h2>
                                <p className='text-sm md:text-base text-white/90 mb-6 font-medium'>
                                    {bannerSlides[currentSlide].subtitle}
                                </p>
                                <Link
                                    href={bannerSlides[currentSlide].href}
                                    className='inline-flex items-center gap-2 bg-orange-500 text-white font-bold text-sm md:text-base px-6 py-3 rounded-full hover:bg-orange-600 transition-all duration-300'
                                >
                                    <Zap size={18} />
                                    {bannerSlides[currentSlide].cta}
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>

                <button
                    onClick={goToPrev}
                    aria-label="Previous slide"
                    className='absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-sm flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity'
                >
                    <ChevronLeft size={24} />
                </button>
                <button
                    onClick={goToNext}
                    aria-label="Next slide"
                    className='absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-sm flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity'
                >
                    <ChevronRight size={24} />
                </button>

                <div className='absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2.5 bg-black/30 p-2 rounded-full backdrop-blur-sm'>
                    {bannerSlides.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => goToSlide(i)}
                            className={`h-2 rounded-full transition-all duration-300 ${i === currentSlide ? 'w-8 bg-white' : 'w-2 bg-white/50'}`}
                        />
                    ))}
                </div>
            </div>

            {/* Filtering Control Panel */}
            <div className='w-full mb-12 p-6 bg-white border border-gray-100 rounded-3xl shadow-sm'>
                <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-5 mb-8'>
                    <div className='flex items-center gap-4 px-1'>
                        <BookOpenText className='text-orange-500' size={28} />
                        <h1 className='text-4xl md:text-5xl font-extrabold font-playfair text-gray-900 tracking-tight leading-tight'>
                            Discover{' '}
                            <span className='text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500'>
                                Notes
                            </span>
                        </h1>
                    </div>

                    <div className='relative w-full md:w-80 group'>
                        <Search size={20} className='absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors' />
                        <input
                            type="text"
                            placeholder="Search by title, subject..."
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            className='w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 shadow-inner transition-all'
                        />
                    </div>
                </div>

                {/* Quick-Filter Subject Chips — horizontal scroll, not wrap */}
                {/* <div className='flex items-center gap-2.5 px-1 overflow-x-auto pb-1'>
                    <span className='text-sm font-bold text-gray-400 uppercase tracking-wider pr-2 shrink-0'>Quick Filters (Categories):</span>
                    {categories.map(subject => (
                        <button
                            key={subject}
                            onClick={() => setselectedCategory(subject)}
                            disabled={isLoading}
                            className={`shrink-0 px-5 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-300 disabled:opacity-60 ${selectedCategory === subject
                                ? 'bg-orange-500 text-white border border-orange-500 shadow-md shadow-orange-500/10'
                                : 'bg-white text-gray-600 border border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                                }`}
                        >
                            {subject}
                        </button>
                    ))}
                </div> */}

                {/* Quick-Filter Category Dropdown */}
                <div className='flex flex-col sm:flex-row sm:items-center gap-3 px-1'>
                    <label
                        htmlFor="category-select"
                        className='text-sm font-bold text-gray-400 uppercase tracking-wider shrink-0'
                    >
                        Filter by Category:
                    </label>

                    <div className='relative w-full sm:w-64'>
                        <select
                            id="category-select"
                            value={selectedCategory}
                            onChange={(e) => setselectedCategory(e.target.value)}
                            disabled={isLoading}
                            className='w-full appearance-none px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all cursor-pointer disabled:opacity-60'
                        >
                            {categories.map((subject) => (
                                <option key={subject} value={subject}>
                                    {subject}
                                </option>
                            ))}
                        </select>

                        {/* Custom Chevron Arrow */}
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Dynamic Notes Rendering Section */}
            <div id="all-notes">
                {isLoading ? (
                    <div className='w-full grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 p-4 gap-6'>
                        {Array.from({ length: 8 }).map((_, idx) => (
                            <NotesCardSkeleton key={idx} />
                        ))}
                    </div>
                ) : !currentNotes || currentNotes.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="w-full text-center py-24 flex flex-col items-center justify-center text-gray-500 bg-white rounded-3xl shadow-inner border border-gray-100 px-6"
                    >
                        <Zap size={36} className='text-orange-500 mb-5' strokeWidth={1} />
                        <p className="text-xl md:text-2xl font-bold tracking-tight text-gray-700">No notes found.</p>
                        <p className="text-sm md:text-base text-gray-500 mt-1 max-w-sm">
                            {searchText
                                ? `No results match "${searchText}" in ${selectedCategory === 'All' ? 'the whole hub' : `the ${selectedCategory} subject`}. Try adjusting your search.`
                                : `It looks like no notes have been listed in the "${selectedCategory}" category yet!`}
                        </p>
                    </motion.div>
                ) : (
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
                        className="w-full grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 p-1"
                    >
                        {currentNotes.map((notes) => (
                            <motion.div
                                key={notes._id}
                                variants={{
                                    hidden: { opacity: 0, y: 16 },
                                    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
                                }}
                            >
                                <NotesCard
                                    notesId={notes._id}
                                    notesSample1={notes?.notesSample1}
                                    title={notes.title}
                                    subject={notes.subject}
                                    sellerName={notes.seller?.fullName}
                                    notesPrice={notes.price}
                                    onDelete={handleDeleteNotes}
                                />
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </div>
        </div>
    );
}

export default Page;










// old code
// "use client";
// import React, { useState, useEffect } from 'react';
// import { useSelector, useDispatch } from 'react-redux';
// import Link from 'next/link';
// import { motion, AnimatePresence } from 'framer-motion';
// import { toast } from 'sonner';
// import { ChevronLeft, ChevronRight } from 'lucide-react';

// import NotesCardSkeleton from '@/components/SkeletonLoaders/NotesCardSkeleton';
// import NotesCard from '@/components/ui/NotesCard';
// import { deleteNotes } from '@/utils/notesApi';
// // import { removeNoteFromState } from '@/store/notesSlice';

// const bannerSlides = [
//     {
//         title: "Find Exactly What You Need",
//         subtitle: "Every note is tagged by subject, so you can spot the right one in seconds.",
//         cta: "Browse Notes",
//         href: "#all-notes",
//         image: "https://images.unsplash.com/photo-1741699428220-65f37f3fbbcb?auto=format&fit=crop&w=1600&q=80"
//     },
//     {
//         title: "Not Sure It's Right? Ask First.",
//         subtitle: "Chat with our AI about any note's content before you spend a single rupee.",
//         cta: "Try AI Chat",
//         href: "/all-notes",
//         image: "https://images.unsplash.com/photo-1758270705290-62b6294dd044?auto=format&fit=crop&w=1600&q=80"
//     },
//     {
//         title: "Turn Your Notes Into Income",
//         subtitle: "Upload your best notes and keep 70% of every sale, paid out per download.",
//         cta: "Start Selling",
//         href: "/sellnotes",
//         image: "https://images.unsplash.com/photo-1735825764460-c5dec05d6253?auto=format&fit=crop&w=1600&q=80"
//     }
// ];

// function Page() {
//     const dispatch = useDispatch();
//     const allNotes = useSelector((state) => state.notes.allNotes);

//     const [currentSlide, setCurrentSlide] = useState(0);
//     const [direction, setDirection] = useState(1);
//     const [isHovered, setIsHovered] = useState(false);

//     useEffect(() => {
//         if (isHovered) return;
//         const timer = setInterval(() => {
//             setDirection(1);
//             setCurrentSlide((prev) => (prev + 1) % bannerSlides.length);
//         }, 4500);
//         return () => clearInterval(timer);
//     }, [isHovered]);

//     const goToSlide = (index) => {
//         setDirection(index > currentSlide ? 1 : -1);
//         setCurrentSlide(index);
//     };

//     const goToPrev = () => {
//         setDirection(-1);
//         setCurrentSlide((prev) => (prev - 1 + bannerSlides.length) % bannerSlides.length);
//     };

//     const goToNext = () => {
//         setDirection(1);
//         setCurrentSlide((prev) => (prev + 1) % bannerSlides.length);
//     };

//     const handleDeleteNotes = async (notesId) => {
//         try {
//             await deleteNotes(notesId);
//             // dispatch(removeNoteFromState(notesId));
//             toast.success("Notes deleted successfully");
//         } catch (error) {
//             console.error("Error while deleting notes:", error);
//             toast.error("Something went wrong while deleting the notes");
//         }
//     };

//     return (
//         <div className='w-full min-h-screen py-20 px-2 xl:px-6'>

//             {/* Banner Carousel */}
//             <div
//                 className='relative w-full h-64 sm:h-72 md:h-80 rounded-3xl overflow-hidden mb-10 shadow-xl group'
//                 onMouseEnter={() => setIsHovered(true)}
//                 onMouseLeave={() => setIsHovered(false)}
//             >
//                 <AnimatePresence mode="wait" custom={direction}>
//                     <motion.div
//                         key={currentSlide}
//                         custom={direction}
//                         initial={{ opacity: 0, x: direction * 60 }}
//                         animate={{ opacity: 1, x: 0 }}
//                         exit={{ opacity: 0, x: -direction * 60 }}
//                         transition={{ duration: 0.5, ease: "easeInOut" }}
//                         className='absolute inset-0'
//                     >
//                         <div
//                             className='absolute inset-0 bg-cover bg-center'
//                             style={{ backgroundImage: `url(${bannerSlides[currentSlide].image})` }}
//                         />
//                         <div className='absolute inset-0 bg-gradient-to-r from-black/75 via-black/40 to-black/10' />

//                         <div className='relative h-full flex items-center px-8 md:px-14'>
//                             <div className='max-w-md'>
//                                 <h2 className='text-2xl md:text-3xl font-extrabold font-playfair text-white mb-2'>
//                                     {bannerSlides[currentSlide].title}
//                                 </h2>
//                                 <p className='text-sm md:text-base text-white/90 mb-5'>
//                                     {bannerSlides[currentSlide].subtitle}
//                                 </p>
//                                 <Link
//                                     href={bannerSlides[currentSlide].href}
//                                     className='inline-block bg-white text-orange-600 font-semibold text-sm px-5 py-2.5 rounded-full hover:scale-105 transition-transform'
//                                 >
//                                     {bannerSlides[currentSlide].cta}
//                                 </Link>
//                             </div>
//                         </div>
//                     </motion.div>
//                 </AnimatePresence>

//                 <button
//                     onClick={goToPrev}
//                     aria-label="Previous slide"
//                     className='absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-sm flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity'
//                 >
//                     <ChevronLeft size={20} />
//                 </button>
//                 <button
//                     onClick={goToNext}
//                     aria-label="Next slide"
//                     className='absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-sm flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity'
//                 >
//                     <ChevronRight size={20} />
//                 </button>

//                 <div className='absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2'>
//                     {bannerSlides.map((_, i) => (
//                         <button
//                             key={i}
//                             onClick={() => goToSlide(i)}
//                             aria-label={`Go to slide ${i + 1}`}
//                             className={`h-2 rounded-full transition-all ${i === currentSlide ? 'w-6 bg-white' : 'w-2 bg-white/50'}`}
//                         />
//                     ))}
//                 </div>
//             </div>

//             <div id="all-notes">
//                 <h1 className='text-4xl md:text-5xl px-3 py-5 xl:py-10 xl:px-1 font-extrabold font-playfair text-gray-800 leading-tight'>
//                     All{' '}
//                     <span className='text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600'>
//                         Notes
//                     </span>
//                 </h1>
//             </div>

//             {!allNotes ? (
//                 <div className='w-full grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 p-4 gap-5'>
//                     {Array.from({ length: 8 }).map((_, idx) => (
//                         <NotesCardSkeleton key={idx} />
//                     ))}
//                 </div>
//             ) : allNotes.length === 0 ? (
//                 <div className="w-full text-center py-20 text-gray-500">
//                     <p className="text-xl font-medium">No notes available right now.</p>
//                     <p className="text-sm mt-1">Be the first to list yours!</p>
//                 </div>
//             ) : (
//                 <motion.div
//                     initial="hidden"
//                     animate="visible"
//                     variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
//                     className="w-full grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4"
//                 >
//                     {allNotes.map((notes) => (
//                         <motion.div
//                             key={notes._id}
//                             variants={{
//                                 hidden: { opacity: 0, y: 20 },
//                                 visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
//                             }}
//                         >
//                             <NotesCard
//                                 notesId={notes._id}
//                                 notesSample1={notes?.notesSample1}
//                                 title={notes.title}
//                                 subject={notes.subject}
//                                 sellerName={notes.seller?.fullName}
//                                 notesPrice={notes.price}
//                                 onDelete={handleDeleteNotes}
//                             />
//                         </motion.div>
//                     ))}
//                 </motion.div>
//             )}
//         </div>
//     );
// }

// export default Page;




