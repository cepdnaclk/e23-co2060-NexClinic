"use client";

import React, { useMemo, useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import BlackButton from '@/components/buttons/BlackButton';
import RoleBasedNavbar from '@/components/common/RoleBasedNavbar';
import WhiteButton from '@/components/buttons/WhiteButton';
import GreenButton from '@/components/buttons/GreenButton';

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

const API_KEY = '3ad27a1f2e6ec9457e36de238ce09fcf';

export default function NewsArticlesPage() {
    const [articles, setArticles] = useState<NewsArticle[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [selectedCategory, setSelectedCategory] = useState<string>('All Articles');
    const newsSectionRef = useRef<HTMLElement>(null);
    const [spotlightIndex, setSpotlightIndex] = useState<number>(0);

    const handleCategoryClick = (category: string) => {
        setSelectedCategory(category);
        if (newsSectionRef.current) {
            newsSectionRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    };

    useEffect(() => {
        const fetchNews = async () => {
            setLoading(true);
            try {
                let url = '';
                if (selectedCategory === 'Trending') {
                    url = `https://gnews.io/api/v4/top-headlines?category=health&lang=en&apikey=${API_KEY}`;
                } else {
                    const queryCategory = selectedCategory.toLowerCase().replace(/&/g, 'and').replace(/'/g, '');
                    const query = selectedCategory === 'All Articles' ? 'health' : `health ${queryCategory}`;
                    url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(query)}&lang=en&sortby=publishedAt&apikey=${API_KEY}`;
                }
                const response = await fetch(url);
                const data = await response.json();

                if (data && data.articles) {
                    const formattedArticles: NewsArticle[] = data.articles.map((article: any, index: number) => ({
                        id: index,
                        url: article.url,
                        title: article.title,
                        summary: article.description,
                        author: article.source.name,
                        date: new Date(article.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
                        category: selectedCategory === 'All Articles' ? 'Health News' : selectedCategory,
                        imageUrl: article.image || "/images/medical-ai.jpg",
                        readTime: "5 min read"
                    }));
                    setArticles(formattedArticles);
                }
            } catch (error) {
                console.error("Error fetching news:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchNews();
    }, [selectedCategory]);

    useEffect(() => {
        if (articles.length === 0) return;

        const intervalId = setInterval(() => {
            setSpotlightIndex((prevIndex) => (prevIndex + 1) % Math.min(articles.length, 5));
        }, 5000);

        return () => clearInterval(intervalId);
    }, [articles, spotlightIndex]);

    const categories = [
        'Trending',
        'All Articles',
        'Sri Lanka',
        'Medical Technology',
        'Neurology & Brain Health',
        'Digital Health',
        'Mental Health',
        'Public Health',
        'Cancer',
        "Women's Health"
    ];

    const filteredArticles = articles;

    const featuredArticle = filteredArticles[0];
    const secondaryArticles = filteredArticles.slice(1);

    return (
        <div className="min-h-screen bg-[#f3f8f5] dark:bg-slate-950">
            <div className='fixed w-full z-10'>
                <RoleBasedNavbar />
            </div>

            <main className="pt-24 pb-16">
                {/* Hero */}
                <section className="relative overflow-hidden border-b border-emerald-100 dark:border-emerald-900 bg-white dark:bg-slate-900">
                    <div className="absolute -top-20 -left-16 h-56 w-56 rounded-full bg-emerald-100 dark:bg-emerald-900/30 blur-3xl" />
                    <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-lime-100 dark:bg-lime-900/30 blur-3xl" />

                    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
                        <div className="grid items-center gap-8 lg:grid-cols-2">
                            <div>
                                <p className="inline-flex rounded-full border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/30 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-800 dark:text-emerald-300">
                                    NexClinic Health Desk
                                </p>
                                <h1 className="mt-4 text-4xl font-black leading-tight text-gray-900 dark:text-white md:text-5xl">
                                    Fresh, trusted medical updates for patients and doctors
                                </h1>
                                <p className="mt-4 max-w-xl text-base text-gray-600 dark:text-slate-400 md:text-lg">
                                    Explore expert summaries, clinical breakthroughs, and practical wellness stories curated to fit the NexClinic care journey.
                                </p>
                                <div className="mt-6 flex flex-wrap items-center gap-3">
                                    <GreenButton className="px-6 py-3" onClick={() => handleCategoryClick('Trending')}>
                                        Explore Trending
                                    </GreenButton>
                                    <WhiteButton className="px-6 py-3" onClick={() => handleCategoryClick('All Articles')}>
                                        View Recent Articles
                                    </WhiteButton>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3">
                                <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm overflow-hidden">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-700 dark:text-slate-400">Today&apos;s spotlights</p>
                                        <div className="flex gap-1.5">
                                            {articles.length > 0 && Array.from({ length: Math.min(articles.length, 5) }).map((_, index) => (
                                                <button
                                                    key={index}
                                                    onClick={() => setSpotlightIndex(index)}
                                                    className={`h-1.5 rounded-full transition-all duration-300 ${
                                                        index === spotlightIndex
                                                            ? 'w-4 bg-emerald-500'
                                                            : 'w-1.5 bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600'
                                                    }`}
                                                    aria-label={`Go to spotlight ${index + 1}`}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    <div key={spotlightIndex} className="animate-in fade-in slide-in-from-right-4 duration-500">
                                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                                            {articles.length > 0 ? (
                                                <Link href={articles[spotlightIndex].url} target="_blank" rel="noopener noreferrer" className="hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors">
                                                    {articles[spotlightIndex].title}
                                                </Link>
                                            ) : (
                                                loading ? "Loading..." : "No articles found."
                                            )}
                                        </p>
                                        <p className="mt-2 text-sm text-gray-600 dark:text-slate-400 line-clamp-2">
                                            {articles.length > 0 ? articles[spotlightIndex].summary : (loading ? "Please wait while we fetch the latest health news." : "")}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Content */}
                <section ref={newsSectionRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 scroll-mt-24">
                    {/* Category Filter */}
                    <div className="mb-8 flex flex-wrap gap-2">
                        {categories.map((category) => {
                            const isActive = category === selectedCategory;

                            if (isActive) {
                                return (
                                    <BlackButton
                                        key={category}
                                        className="px-4 py-2 text-sm"
                                        onClick={() => handleCategoryClick(category)}
                                    >
                                        {category}
                                    </BlackButton>
                                );
                            }

                            return (
                                <button
                                    key={category}
                                    type="button"
                                    onClick={() => handleCategoryClick(category)}
                                    className="px-4 py-2 rounded-lg bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 text-sm font-medium hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:border-emerald-300 dark:hover:border-emerald-700 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
                                >
                                    {category}
                                </button>
                            );
                        })}
                    </div>

                    {/* Featured and Side List */}
                    {featuredArticle ? (
                        <div className="grid gap-6 lg:grid-cols-3 mb-10">
                            <article className="lg:col-span-2 rounded-3xl overflow-hidden border border-emerald-100 dark:border-emerald-900 bg-white dark:bg-slate-900 shadow-md">
                                <div className="h-56 bg-gradient-to-br from-emerald-500 via-emerald-400 to-lime-400 p-6 text-white flex flex-col justify-end">
                                    <span className="inline-flex w-fit rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
                                        Featured Story
                                    </span>
                                    <h2 className="mt-4 text-2xl md:text-3xl font-extrabold max-w-3xl hover:underline">
                                        <Link href={featuredArticle.url} target="_blank" rel="noopener noreferrer">
                                            {featuredArticle.title}
                                        </Link>
                                    </h2>
                                </div>

                                <div className="p-6">
                                    <p className="text-gray-700 dark:text-slate-300 leading-7">{featuredArticle.summary}</p>
                                    <div className="mt-5 flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-slate-400">
                                        <span className="rounded-full bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1 font-semibold text-emerald-700 dark:text-emerald-400">{featuredArticle.category}</span>
                                        <span>{featuredArticle.author}</span>
                                        <span>{featuredArticle.date}</span>
                                        <span>{featuredArticle.readTime}</span>
                                    </div>
                                    <div className="mt-6">
                                        <Link
                                            href={featuredArticle.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex rounded-lg bg-green-500 px-6 py-3 font-semibold text-white transition-colors hover:bg-green-600"
                                        >
                                            Read Full Article
                                        </Link>
                                    </div>
                                </div>
                            </article>

                            <div className="space-y-4">
                                {secondaryArticles.slice(0, 3).map((article) => (
                                    <article key={article.id} className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm hover:shadow-md transition-shadow">
                                        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">{article.category}</p>
                                        <h3 className="mt-2 text-base font-bold text-gray-900 dark:text-white line-clamp-2">
                                            <Link href={article.url} target="_blank" rel="noopener noreferrer" className="hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors">
                                                {article.title}
                                            </Link>
                                        </h3>
                                        <p className="mt-2 text-sm text-gray-600 dark:text-slate-400 line-clamp-2">{article.summary}</p>
                                        <Link
                                            href={article.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="mt-3 inline-block text-sm font-semibold text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-300"
                                        >
                                            Continue reading
                                        </Link>
                                    </article>
                                ))}
                            </div>
                        </div>
                    ) : null}

                    {/* Articles Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredArticles.map((article, index) => (
                            <article
                                key={article.id}
                                className="group rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                                style={{ animationDelay: `${index * 80}ms` }}
                            >
                                <Link href={article.url} target="_blank" rel="noopener noreferrer" className="block h-40 w-full rounded-xl overflow-hidden border border-emerald-100 dark:border-emerald-900 bg-gray-50 dark:bg-slate-800 relative">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={article.imageUrl}
                                        alt={article.title}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        loading="lazy"
                                    />
                                </Link>

                                <div className="mt-4">
                                    <h2 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-2 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors hover:underline">
                                        <Link href={article.url} target="_blank" rel="noopener noreferrer">
                                            {article.title}
                                        </Link>
                                    </h2>
                                    <p className="mt-2 text-sm text-gray-600 dark:text-slate-400 line-clamp-3">{article.summary}</p>
                                </div>

                                <div className="mt-4 flex items-center justify-between text-xs text-gray-500 dark:text-slate-400">
                                    <span className="font-medium text-gray-700 dark:text-slate-300">{article.author}</span>
                                    <span>{article.readTime}</span>
                                </div>
                                <div className="mt-1 text-xs text-gray-400 dark:text-slate-500">{article.date}</div>

                                <div className="mt-4">
                                    <Link
                                        href={article.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-300"
                                    >
                                        Read Full Article
                                    </Link>
                                </div>
                            </article>
                        ))}
                    </div>

                    {/* Newsletter Banner */}
                    <div className="mt-12 rounded-3xl border border-emerald-200 bg-gradient-to-r from-emerald-600 to-green-500 p-8 text-white shadow-lg">
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-100">Weekly Health Brief</p>
                                <h3 className="mt-2 text-2xl font-extrabold">Receive curated medical stories every Monday</h3>
                                <p className="mt-2 text-sm text-emerald-50 max-w-xl">
                                    We summarize important findings from trusted journals and present them in a patient-friendly, doctor-approved format.
                                </p>
                            </div>
                            <WhiteButton className="px-6 py-3 border-white text-emerald-700 hover:bg-emerald-50">
                                Subscribe for Updates
                            </WhiteButton>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
