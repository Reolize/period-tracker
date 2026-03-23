"use client"

import { useState } from "react"
import { Search, BookOpen, Clock, ArrowRight, Sparkles, HeartPulse, Activity } from "lucide-react"

const CATEGORIES = ["All", "Cycle", "Wellness", "Body", "Nutrition", "Mental Health"]

const ARTICLES = [
  {
    id: 1,
    title: "Why do I get cramps? Understanding the science behind period pain.",
    category: "Body",
    readTime: "5 min read",
    image: "bg-gradient-to-br from-[#ff7eb6] to-[#a78bfa]",
    featured: true,
  },
  {
    id: 2,
    title: "Understanding ovulation: Signs and symptoms to watch for",
    category: "Cycle",
    readTime: "4 min read",
    image: "bg-[#fff0f6]",
  },
  {
    id: 3,
    title: "How sleep affects your hormones and menstrual cycle",
    category: "Wellness",
    readTime: "6 min read",
    image: "bg-[#f0f9ff]",
  },
  {
    id: 4,
    title: "Nutrition tips for every phase of your cycle",
    category: "Nutrition",
    readTime: "7 min read",
    image: "bg-[#fefce8]",
  },
  {
    id: 5,
    title: "Managing mood swings and PMS effectively",
    category: "Mental Health",
    readTime: "5 min read",
    image: "bg-[#f7f1ff]",
  },
]

export default function HealthLibraryPage() {
  const [activeCategory, setActiveCategory] = useState("All")
  const [searchQuery, setSearchQuery] = useState("")

  const filteredArticles = ARTICLES.filter(article => {
    const matchesCategory = activeCategory === "All" || article.category === activeCategory
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const featuredArticle = filteredArticles.find(a => a.featured) || filteredArticles[0]
  const gridArticles = filteredArticles.filter(a => a.id !== featuredArticle?.id)

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-16 p-4 sm:p-6 lg:p-8 selection:bg-[#ff7eb6] selection:text-white">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-[#3f2b4d] tracking-tight flex items-center gap-3 mb-2">
            <BookOpen className="text-[#ff7eb6]" size={32} />
            Health Library
          </h1>
          <p className="text-[#7d6b86] text-lg">Curated articles to help you understand your body better.</p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-72">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7d6b86]">
            <Search size={18} />
          </div>
          <input
            type="text"
            placeholder="Search topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white border border-[#f0e8ee] focus:border-[#ff7eb6] focus:ring-4 focus:ring-[#ff7eb6]/10 outline-none transition-all text-[#3f2b4d] shadow-sm"
          />
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 gap-3 custom-scrollbar hide-scrollbar">
        {CATEGORIES.map(category => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`whitespace-nowrap px-5 py-2 rounded-full text-sm font-semibold transition-all ${
              activeCategory === category
                ? "bg-[#3f2b4d] text-white shadow-md shadow-[#3f2b4d]/20"
                : "bg-white text-[#7d6b86] border border-[#f0e8ee] hover:border-[#ff7eb6] hover:text-[#3f2b4d]"
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {filteredArticles.length === 0 ? (
        <div className="text-center py-20 text-[#7d6b86]">
          <BookOpen size={48} className="mx-auto mb-4 opacity-20" />
          <p className="text-lg">No articles found for "{searchQuery}"</p>
        </div>
      ) : (
        <>
          {/* Featured Article */}
          {featuredArticle && (
            <div className="group cursor-pointer bg-white rounded-[2rem] border border-[#f0e8ee] shadow-sm hover:shadow-xl hover:shadow-[#ff7eb6]/10 transition-all duration-300 overflow-hidden flex flex-col md:flex-row">
              {/* Image Placeholder */}
              <div className={`w-full md:w-2/5 min-h-[250px] md:min-h-[350px] ${featuredArticle.image} relative overflow-hidden`}>
                <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors" />
                <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-xs font-bold text-[#b06a94] uppercase tracking-wider">
                  <Sparkles size={14} /> Featured
                </div>
              </div>
              
              {/* Content */}
              <div className="p-8 md:p-10 flex flex-col justify-center flex-1">
                <span className="inline-block px-3 py-1 bg-[#fff0f6] text-[#b06a94] text-xs font-bold rounded-lg mb-4 w-fit uppercase tracking-wider">
                  {featuredArticle.category}
                </span>
                <h2 className="text-2xl md:text-3xl font-extrabold text-[#3f2b4d] leading-tight mb-4 group-hover:text-[#ff7eb6] transition-colors">
                  {featuredArticle.title}
                </h2>
                <div className="flex items-center gap-4 text-sm text-[#7d6b86] mt-auto pt-6 border-t border-[#f0e8ee]">
                  <div className="flex items-center gap-1.5">
                    <Clock size={16} />
                    {featuredArticle.readTime}
                  </div>
                  <div className="flex items-center gap-1 text-[#ff7eb6] font-semibold ml-auto group-hover:translate-x-1 transition-transform">
                    Read article <ArrowRight size={16} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Article Grid */}
          {gridArticles.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {gridArticles.map((article) => (
                <div key={article.id} className="group cursor-pointer bg-white rounded-3xl border border-[#f0e8ee] shadow-sm hover:shadow-lg hover:shadow-[#ff7eb6]/10 transition-all duration-300 overflow-hidden flex flex-col">
                  {/* Image Placeholder */}
                  <div className={`w-full h-48 ${article.image} relative`}>
                     <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors" />
                  </div>
                  
                  {/* Content */}
                  <div className="p-6 flex flex-col flex-1">
                    <span className="inline-block text-[#b06a94] text-xs font-bold mb-3 uppercase tracking-wider">
                      {article.category}
                    </span>
                    <h3 className="text-lg font-bold text-[#3f2b4d] leading-snug mb-4 group-hover:text-[#ff7eb6] transition-colors line-clamp-3">
                      {article.title}
                    </h3>
                    
                    <div className="flex items-center justify-between text-xs text-[#7d6b86] mt-auto pt-4 border-t border-[#f0e8ee]/50">
                      <div className="flex items-center gap-1.5">
                        <Clock size={14} />
                        {article.readTime}
                      </div>
                      <div className="text-[#ff7eb6] opacity-0 group-hover:opacity-100 transform -translate-x-2 group-hover:translate-x-0 transition-all">
                        <ArrowRight size={16} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}