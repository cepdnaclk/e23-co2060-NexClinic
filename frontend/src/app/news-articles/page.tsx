import React from 'react';
import Link from 'next/link';
import GreenButton from '@/components/buttons/GreenButton';
import BlackButton from '@/components/buttons/BlackButton';
import MainNavbar from '@/components/HomePage/MainNavbar';
import WhiteButton from '@/components/buttons/WhiteButton';

interface NewsArticle {
    id: number;
    url: string;
    title: string;
    summary: string;
    author: string;
    date: string;
    category: string;
    imageUrl: string;
    readTime: string;
}

const demoArticles: NewsArticle[] = [
    {
        id: 1,
        url: "https://youtu.be/LXrh2AJa8nU?si=GrW4zL7ixYIHcuiL",
        title: "Revolutionary AI Diagnosis System Achieves 99% Accuracy in Early Cancer Detection",
        summary: "New artificial intelligence system developed by leading researchers shows unprecedented accuracy in detecting early-stage cancers across multiple organ systems.",
        author: "Dr. Sarah Johnson",
        date: "January 14, 2026",
        category: "Medical Technology",
        imageUrl: "/images/medical-ai.jpg",
        readTime: "5 min read"
    },
    {
        id: 2,
        url: "https://youtu.be/example2",
        title: "Breakthrough in Alzheimer's Treatment Shows Promising Results in Clinical Trials",
        summary: "A novel drug treatment has demonstrated significant cognitive improvement in Alzheimer's patients during phase 3 clinical trials.",
        author: "Dr. Michael Chen",
        date: "January 12, 2026",
        category: "Neurology",
        imageUrl: "/images/alzheimers-research.jpg",
        readTime: "7 min read"
    },
    {
        id: 3,
        url: "https://youtu.be/example3",
        title: "Telemedicine Adoption Increases by 300% Post-Pandemic",
        summary: "Healthcare providers report sustained growth in virtual consultations as patients continue to embrace digital health solutions.",
        author: "Emily Roberts",
        date: "January 10, 2026",
        category: "Digital Health",
        imageUrl: "/images/telemedicine.jpg",
        readTime: "4 min read"
    },
    {
        id: 4,
        url: "https://youtu.be/example4",
        title: "New Guidelines Released for Managing Type 2 Diabetes in 2026",
        summary: "Leading endocrinology association updates treatment protocols incorporating latest research on lifestyle interventions and medication.",
        author: "Dr. James Wilson",
        date: "January 8, 2026",
        category: "Endocrinology",
        imageUrl: "/images/diabetes-care.jpg",
        readTime: "6 min read"
    },
    {
        id: 5,
        url: "https://youtu.be/example5",
        title: "Mental Health Apps Show Effectiveness in Treating Mild to Moderate Anxiety",
        summary: "Comprehensive study reveals that digital mental health interventions can be as effective as traditional therapy for certain conditions.",
        author: "Dr. Lisa Anderson",
        date: "January 6, 2026",
        category: "Mental Health",
        imageUrl: "/images/mental-health-tech.jpg",
        readTime: "5 min read"
    },
    {
        id: 6,
        url: "https://youtu.be/example6",
        title: "Vitamin D Deficiency Linked to Increased Risk of Respiratory Infections",
        summary: "Large-scale study confirms correlation between low vitamin D levels and susceptibility to common respiratory illnesses.",
        author: "Dr. Robert Martinez",
        date: "January 4, 2026",
        category: "Public Health",
        imageUrl: "/images/vitamin-d.jpg",
        readTime: "4 min read"
    },
    {
        id: 7,
        url: "https://youtu.be/example7",
        title: "Innovative Heart Surgery Technique Reduces Recovery Time by 50%",
        summary: "Minimally invasive cardiac procedure allows patients to return to normal activities significantly faster than traditional surgery.",
        author: "Dr. Patricia Kumar",
        date: "January 2, 2026",
        category: "Cardiology",
        imageUrl: "/images/heart-surgery.jpg",
        readTime: "6 min read"
    },
    {
        id: 8,
        url: "https://youtu.be/example8",
        title: "Global Health Organizations Launch Initiative to Combat Antimicrobial Resistance",
        summary: "WHO and partners announce comprehensive strategy to address growing threat of antibiotic-resistant bacteria.",
        author: "Dr. Ahmed Hassan",
        date: "December 30, 2025",
        category: "Global Health",
        imageUrl: "/images/antimicrobial.jpg",
        readTime: "8 min read"
    }
];

export default function NewsArticlesPage() {
    return (
        <div className="min-h-screen bg-gray-50">
            <div className='fixed w-full z-10'>
                <MainNavbar/>
            </div>
            {/* Header */}
            <div className="bg-white shadow-sm border-b pt-24">

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <h1 className="text-4xl font-bold text-gray-900">Latest Health News & Articles</h1>
                    <p className="mt-2 text-lg text-gray-600">
                        Stay informed with the latest medical research, health tips, and industry news
                    </p>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Category Filter */}
                <div className="mb-8 flex flex-wrap gap-2">
                    <BlackButton className="px-4 py-2">
                        All Articles
                    </BlackButton>
                    <button className="px-4 py-2 bg-white text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-100 border">
                        Medical Technology
                    </button>
                    <button className="px-4 py-2 bg-white text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-100 border">
                        Mental Health
                    </button>
                    <button className="px-4 py-2 bg-white text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-100 border">
                        Cardiology
                    </button>
                    <button className="px-4 py-2 bg-white text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-100 border">
                        Public Health
                    </button>
                </div>

                {/* Articles Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                    {demoArticles.map((article) => (
                        <article
                            key={article.id}
                            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300"
                        >
                            {/* Article Image */}
                            <div className="h-48 bg-gradient-to-br from-green-200 to-green-600 flex items-center justify-center">
                                <span className="text-white text-sm font-medium">
                                    {article.category}
                                </span>
                            </div>

                            {/* Article Content */}
                            <div className="p-6">
                                {/* Category Badge */}
                                <span className="inline-block px-3 py-1 bg-green-100 text-green-600 text-xs font-semibold rounded-full mb-3">
                                    {article.category}
                                </span>

                                {/* Title */}
                                <h2 className="text-xl font-bold text-gray-900 mb-3 line-clamp-3 hover:text-blue-600">
                                    <Link href={`/news-articles/${article.id}`}>
                                        {article.title}
                                    </Link>
                                </h2>

                                {/* Summary */}
                                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                                    {article.summary}
                                </p>

                                {/* Meta Info */}
                                <div className="flex items-center justify-between text-xs text-gray-500 border-t pt-4">
                                    <div className="flex items-center space-x-2">
                                        <span className="font-medium text-gray-700">{article.author}</span>
                                    </div>
                                    <span>{article.readTime}</span>
                                </div>

                                {/* Date */}
                                <div className="mt-2 text-xs text-gray-400">
                                    {article.date}
                                </div>

                                {/* Read More Link */}
                                <WhiteButton className='mt-2 shadow-md'>
                                <Link
                                    href={`${article.url}`}
                                    className="mt-4 text-green-600 font-semibold text-sm hover:text-green-800"
                                >
                                    Read Full Article →
                                </Link>
                                </WhiteButton>
                            </div>
                        </article>
                    ))}
                </div>

                {/* Load More Button */}
                <div className="mt-12 text-center">
                    <button className="px-8 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors">
                        Load More Articles
                    </button>
                </div>
            </div>
        </div>
    );
}
