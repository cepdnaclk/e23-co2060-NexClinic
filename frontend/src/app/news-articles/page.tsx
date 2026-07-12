"use client";

import React, { useMemo, useState, useEffect } from 'react';
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
        <div className="min-h-screen bg-[#f3f8f5]">
            <div className='fixed w-full z-10'>
                <RoleBasedNavbar />
            </div>

            <main className="pt-24 pb-16">
                {/* Hero */}
                <section className="relative overflow-hidden border-b border-emerald-100 bg-white">
                    <div className="absolute -top-20 -left-16 h-56 w-56 rounded-full bg-emerald-100 blur-3xl" />
                    <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-lime-100 blur-3xl" />

                    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
                        <div className="grid items-center gap-8 lg:grid-cols-2">
                            <div>
                                <p className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-800">
                                    NexClinic Health Desk
                                </p>
                                <h1 className="mt-4 text-4xl font-black leading-tight text-gray-900 md:text-5xl">
                                    Fresh, trusted medical updates for patients and doctors
                                </h1>
                                <p className="mt-4 max-w-xl text-base text-gray-600 md:text-lg">
                                    Explore expert summaries, clinical breakthroughs, and practical wellness stories curated to fit the NexClinic care journey.
                                </p>
                                <div className="mt-6 flex flex-wrap items-center gap-3">
                                    <GreenButton className="px-6 py-3" onClick={() => setSelectedCategory('Trending')}>
                                        Explore Trending
                                    </GreenButton>
                                    <WhiteButton className="px-6 py-3" onClick={() => setSelectedCategory('All Articles')}>
                                        View Recent Articles
                                    </WhiteButton>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-100 to-emerald-50 p-5 shadow-sm">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Published this month</p>
                                    <p className="mt-3 text-4xl font-black text-gray-900">48</p>
                                    <p className="mt-2 text-sm text-gray-600">Articles reviewed by healthcare professionals</p>
                                </div>
                                <div className="rounded-2xl border border-teal-100 bg-gradient-to-br from-teal-100 to-cyan-50 p-5 shadow-sm">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Reader trust score</p>
                                    <p className="mt-3 text-4xl font-black text-gray-900">4.9</p>
                                    <p className="mt-2 text-sm text-gray-600">Average rating based on relevance and clarity</p>
                                </div>
                                <div className="col-span-2 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-700">Today&apos;s spotlight</p>
                                    <p className="mt-2 text-lg font-bold text-gray-900">
                                        {articles.length > 0 ? articles[0].title : (loading ? "Loading..." : "No articles found.")}
                                    </p>
                                    <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                                        {articles.length > 0 ? articles[0].summary : (loading ? "Please wait while we fetch the latest health news." : "")}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Content */}
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                    {/* Category Filter */}
                    <div className="mb-8 flex flex-wrap gap-2">
                        {categories.map((category) => {
                            const isActive = category === selectedCategory;

                            if (isActive) {
                                return (
                                    <BlackButton
                                        key={category}
                                        className="px-4 py-2 text-sm"
                                        onClick={() => setSelectedCategory(category)}
                                    >
                                        {category}
                                    </BlackButton>
                                );
                            }

                            return (
                                <button
                                    key={category}
                                    type="button"
                                    onClick={() => setSelectedCategory(category)}
                                    className="px-4 py-2 rounded-lg bg-white border border-gray-200 text-gray-700 text-sm font-medium hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 transition-colors"
                                >
                                    {category}
                                </button>
                            );
                        })}
                    </div>

                    {/* Featured and Side List */}
                    {featuredArticle ? (
                        <div className="grid gap-6 lg:grid-cols-3 mb-10">
                            <article className="lg:col-span-2 rounded-3xl overflow-hidden border border-emerald-100 bg-white shadow-md">
                                <div className="h-56 bg-gradient-to-br from-emerald-500 via-emerald-400 to-lime-400 p-6 text-white flex flex-col justify-end">
                                    <span className="inline-flex w-fit rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
                                        Featured Story
                                    </span>
                                    <h2 className="mt-4 text-2xl md:text-3xl font-extrabold max-w-3xl">
                                        {featuredArticle.title}
                                    </h2>
                                </div>

                                <div className="p-6">
                                    <p className="text-gray-700 leading-7">{featuredArticle.summary}</p>
                                    <div className="mt-5 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                                        <span className="rounded-full bg-emerald-50 px-3 py-1 font-semibold text-emerald-700">{featuredArticle.category}</span>
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
                                    <article key={article.id} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
                                        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">{article.category}</p>
                                        <h3 className="mt-2 text-base font-bold text-gray-900 line-clamp-2">{article.title}</h3>
                                        <p className="mt-2 text-sm text-gray-600 line-clamp-2">{article.summary}</p>
                                        <Link
                                            href={article.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="mt-3 inline-block text-sm font-semibold text-emerald-700 hover:text-emerald-900"
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
                                className="group rounded-2xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                                style={{ animationDelay: `${index * 80}ms` }}
                            >
                                <div className="h-32 rounded-xl bg-gradient-to-br from-emerald-100 via-lime-100 to-white border border-emerald-100 flex items-center justify-center">
                                    <span className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                                        {article.category}
                                    </span>
                                </div>

                                <div className="mt-4">
                                    <h2 className="text-lg font-bold text-gray-900 line-clamp-2 group-hover:text-emerald-700 transition-colors">
                                        {article.title}
                                    </h2>
                                    <p className="mt-2 text-sm text-gray-600 line-clamp-3">{article.summary}</p>
                                </div>

                                <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
                                    <span className="font-medium text-gray-700">{article.author}</span>
                                    <span>{article.readTime}</span>
                                </div>
                                <div className="mt-1 text-xs text-gray-400">{article.date}</div>

                                <div className="mt-4">
                                    <Link
                                        href={article.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm font-semibold text-emerald-700 hover:text-emerald-900"
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
