"use client"

import { useState, useRef, useEffect } from "react"
import { MessageCircle, Clock, Share2, MoreHorizontal, Heart, Trash2, Flag } from "lucide-react"
import { useRouter } from "next/navigation"
import type { Post, ReactionType, Comment } from "@/app/types/tracking"

interface PostCardProps {
  post: Post
  onReact: (postId: number, reactionType: ReactionType) => void
  onRemoveReaction: (postId: number) => void
  onClick?: () => void
  onDeleteClick?: (postId: number) => void
  onReportClick?: (postId: number) => void
  compact?: boolean
  isAuthor?: boolean
  showAllComments?: boolean
  isDetailView?: boolean
}

const REACTION_CONFIG: Record<ReactionType, { emoji: string; label: string; color: string; hoverColor: string; bgColor: string }> = {
  hug: { 
    emoji: "🫂", 
    label: "Hug", 
    color: "text-rose-500", 
    hoverColor: "hover:bg-rose-50 hover:text-rose-600",
    bgColor: "bg-rose-50 text-rose-600 ring-rose-200"
  },
  me_too: { 
    emoji: "✋", 
    label: "Me too", 
    color: "text-violet-500", 
    hoverColor: "hover:bg-violet-50 hover:text-violet-600",
    bgColor: "bg-violet-50 text-violet-600 ring-violet-200"
  },
  support: { 
    emoji: "💪", 
    label: "Support", 
    color: "text-emerald-500", 
    hoverColor: "hover:bg-emerald-50 hover:text-emerald-600",
    bgColor: "bg-emerald-50 text-emerald-600 ring-emerald-200"
  },
  celebrate: { 
    emoji: "🎉", 
    label: "Celebrate", 
    color: "text-amber-500", 
    hoverColor: "hover:bg-amber-50 hover:text-amber-600",
    bgColor: "bg-amber-50 text-amber-600 ring-amber-200"
  },
}

const BADGE_ICONS: Record<string, { icon: string; color: string }> = {
  "verified_doctor": { icon: "🩺", color: "text-blue-500" },
  "admin": { icon: "👑", color: "text-amber-500" },
  "1_year_veteran": { icon: "🌟", color: "text-purple-500" },
}

const CATEGORY_STYLES: Record<string, { bg: string; text: string; border: string; icon: string }> = {
  PCOS: { 
    bg: "bg-pink-50", 
    text: "text-pink-700", 
    border: "border-pink-200",
    icon: "🌸"
  },
  Tips: { 
    bg: "bg-teal-50", 
    text: "text-teal-700", 
    border: "border-teal-200",
    icon: "💡"
  },
  Support: { 
    bg: "bg-rose-50", 
    text: "text-rose-700", 
    border: "border-rose-200",
    icon: "🤗"
  },
  General: { 
    bg: "bg-slate-50", 
    text: "text-slate-700", 
    border: "border-slate-200",
    icon: "💬"
  },
  Questions: { 
    bg: "bg-blue-50", 
    text: "text-blue-700", 
    border: "border-blue-200",
    icon: "❓"
  },
}

export function PostCard({ 
  post, 
  onReact, 
  onRemoveReaction, 
  onClick, 
  onDeleteClick,
  onReportClick,
  compact = false,
  isAuthor = false,
  showAllComments = false,
  isDetailView = false
}: PostCardProps) {
  const router = useRouter()
  const [isHovered, setIsHovered] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [comments] = useState<Comment[]>(post.comments || [])
  const menuRef = useRef<HTMLDivElement>(null)

  const totalReactions = Object.values(post.reactions).reduce((a, b) => a + b, 0)
  const categoryStyle = CATEGORY_STYLES[post.category] || CATEGORY_STYLES.General

  // Show only 2 latest non-deleted comments in feed view
  const displayComments = showAllComments 
    ? comments.filter(c => !c.is_deleted)
    : comments.filter(c => !c.is_deleted).slice(0, 2)
  const hasMoreComments = comments.filter(c => !c.is_deleted).length > 2 && !showAllComments

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  function formatTimeAgo(dateString: string): string {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString("en-US", { day: "numeric", month: "short" })
  }

  function handleReactionClick(reactionType: ReactionType, e: React.MouseEvent) {
    e.stopPropagation()
    if (post.user_reaction === reactionType) {
      onRemoveReaction(post.id)
    } else {
      onReact(post.id, reactionType)
    }
  }

  function handleViewAllComments(e: React.MouseEvent) {
    e.stopPropagation()
    router.push(`/community/post/${post.id}`)
  }

  function handlePostClick() {
    if (onClick) {
      onClick()
    } else {
      router.push(`/community/post/${post.id}`)
    }
  }

  function handleDeleteClick(e: React.MouseEvent) {
    e.stopPropagation()
    onDeleteClick?.(post.id)
    setShowMenu(false)
  }

  function handleReportClick(e: React.MouseEvent) {
    e.stopPropagation()
    onReportClick?.(post.id)
    setShowMenu(false)
  }

  function handleShareClick(e: React.MouseEvent) {
    e.stopPropagation()
    const url = `${window.location.origin}/community/post/${post.id}`
    navigator.clipboard.writeText(url)
      .then(() => alert("Link copied to clipboard!"))
      .catch(() => alert("Failed to copy link"))
  }

  return (
    <div
      onClick={handlePostClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        bg-white rounded-2xl border border-[#f0e8ee] overflow-hidden
        transition-all duration-300 cursor-pointer
        ${isHovered ? "shadow-xl shadow-[#ff7eb6]/10 border-[#ff7eb6]/30 transform -translate-y-0.5" : "shadow-sm"}
      `}
    >
      <div className="p-5 pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {/* Avatar - shows profile pic if available */}
            <div
              className={`
                w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold
                shadow-md overflow-hidden flex-shrink-0
                ${post.author.is_anonymous
                  ? "bg-gradient-to-br from-violet-100 via-pink-100 to-purple-100 text-violet-600"
                  : (post.author.avatar_url || post.author.profile_pic_url)
                    ? ""
                    : "bg-gradient-to-br from-[#ff7eb6] via-[#ff4d9f] to-[#ff1a6c] text-white"
                }
              `}
            >
              {post.author.is_anonymous ? (
                "🎭"
              ) : (post.author.avatar_url || post.author.profile_pic_url) ? (
                <img 
                  src={post.author.avatar_url || post.author.profile_pic_url || ""} 
                  alt={post.author.display_name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback to initial if image fails to load
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                    target.parentElement!.innerText = post.author.display_name.charAt(0).toUpperCase()
                    target.parentElement!.className = "w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold shadow-md bg-gradient-to-br from-[#ff7eb6] via-[#ff4d9f] to-[#ff1a6c] text-white"
                  }}
                />
              ) : (
                post.author.display_name.charAt(0).toUpperCase()
              )}
            </div>
            
            {/* Author Info */}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-[#3f2b4d]">
                  {post.author.display_name}
                </p>
                {/* Badges */}
                {post.author.badges && post.author.badges.length > 0 && (
                  <div className="flex items-center gap-1">
                    {post.author.badges.map((badge) => (
                      <span 
                        key={badge}
                        className={`text-sm ${BADGE_ICONS[badge]?.color || 'text-gray-500'}`}
                        title={BADGE_ICONS[badge]?.icon || badge}
                      >
                        {BADGE_ICONS[badge]?.icon || "🏅"}
                      </span>
                    ))}
                  </div>
                )}
                {post.author.is_anonymous && (
                  <span className="text-xs px-2 py-0.5 bg-violet-100 text-violet-600 rounded-full font-medium">
                    Anonymous
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-[#9ca3af]">
                <Clock size={12} />
                <span>{formatTimeAgo(post.created_at)}</span>
                <span>•</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${categoryStyle.bg} ${categoryStyle.text} border ${categoryStyle.border}`}>
                  {categoryStyle.icon} {post.category}
                </span>
              </div>
            </div>
          </div>

          {/* More Options */}
          <div className="relative" ref={menuRef}>
            <button 
              onClick={(e) => {
                e.stopPropagation()
                setShowMenu(!showMenu)
              }}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
            >
              <MoreHorizontal size={18} />
            </button>
            
            {/* Dropdown Menu */}
            {showMenu && (
              <div 
                className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20"
                onClick={(e) => e.stopPropagation()}
              >
                {isAuthor && (
                  <button
                    onClick={handleDeleteClick}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                  >
                    <Trash2 size={14} />
                    Delete Post
                  </button>
                )}
                <button
                  onClick={handleReportClick}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                >
                  <Flag size={14} />
                  Report Post
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-5 pb-4">
        <h3 className="font-bold text-[#3f2b4d] text-lg mb-2 leading-snug hover:text-[#ff7eb6] transition-colors">
          {post.title}
        </h3>
        <p className="text-[#6b7280] text-sm leading-relaxed line-clamp-3">
          {post.content}
        </p>
      </div>

      {/* Reactions Bar */}
      <div className="px-5 py-4 border-t border-[#f0e8ee] bg-gradient-to-r from-gray-50/50 to-white">
        <div className="flex items-center justify-between">
          {/* Reaction Buttons */}
          <div className="flex items-center gap-1">
            {(Object.keys(REACTION_CONFIG) as ReactionType[]).map((reactionType) => {
              const config = REACTION_CONFIG[reactionType]
              const count = post.reactions[reactionType]
              const isActive = post.user_reaction === reactionType

              return (
                <button
                  key={reactionType}
                  onClick={(e) => handleReactionClick(reactionType, e)}
                  className={`
                    flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium
                    transition-all duration-200 border
                    ${isActive
                      ? `${config.bgColor} ring-1 ${config.bgColor.split(' ')[2]} shadow-sm`
                      : `bg-white text-gray-500 border-gray-200 ${config.hoverColor} hover:shadow-sm`
                    }
                    ${count > 0 || isActive ? "opacity-100" : "opacity-70 hover:opacity-100"}
                  `}
                  title={config.label}
                >
                  <span className="text-base">{config.emoji}</span>
                  {(count > 0 || isActive) && (
                    <span className={isActive ? config.color : ""}>
                      {count + (isActive && count === 0 ? 1 : 0)}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Right Side Stats */}
          <div className="flex items-center gap-4">
            {/* Total Reactions */}
            {totalReactions > 0 && (
              <div className="flex items-center gap-1.5 text-sm text-[#6b7280]">
                <Heart size={14} className="text-rose-400 fill-rose-400" />
                <span className="font-medium">{totalReactions}</span>
              </div>
            )}
            
            {/* Comments - Click to view full post */}
            <button
              onClick={handleViewAllComments}
              className="flex items-center gap-1.5 text-sm text-[#6b7280] hover:text-[#ff7eb6] transition-colors"
            >
              <MessageCircle size={16} />
              <span className="font-medium">{post.comment_count || 0}</span>
            </button>

            {/* Share */}
            <button 
              onClick={handleShareClick}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
            >
              <Share2 size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Inline Comments Section - Only show in feed view, NOT in detail view */}
      {!isDetailView && (
        <div className="px-5 pb-4 bg-gray-50/50" onClick={(e) => e.stopPropagation()}>
          {/* Comments List */}
          {displayComments.length > 0 && (
            <div className="pt-3 space-y-3">
              {displayComments.map((comment) => (
                <div key={comment.id} className="flex gap-2">
                  {/* Comment Avatar */}
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 overflow-hidden
                    ${comment.author.is_anonymous
                      ? "bg-gradient-to-br from-violet-100 via-pink-100 to-purple-100 text-violet-600"
                      : (comment.author.avatar_url || comment.author.profile_pic_url)
                        ? ""
                        : "bg-gradient-to-br from-[#ff7eb6] via-[#ff4d9f] to-[#ff1a6c] text-white"
                    }
                  `}>
                    {comment.author.is_anonymous ? "🎭" : (comment.author.avatar_url || comment.author.profile_pic_url) ? (
                      <img 
                        src={comment.author.avatar_url || comment.author.profile_pic_url || ""}
                        alt={comment.author.display_name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.style.display = 'none'
                          target.parentElement!.innerText = comment.author.display_name.charAt(0).toUpperCase()
                          target.parentElement!.className = "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 bg-gradient-to-br from-[#ff7eb6] via-[#ff4d9f] to-[#ff1a6c] text-white"
                        }}
                      />
                    ) : comment.author.display_name.charAt(0).toUpperCase()}
                  </div>
                  
                  {/* Comment Content */}
                  <div className="flex-1">
                    <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-3 py-2">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-semibold text-sm text-[#3f2b4d]">
                          {comment.author.display_name}
                        </span>
                        {comment.author.is_anonymous && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-violet-100 text-violet-600 rounded-full">
                            Anonymous
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-[#6b7280]">{comment.content}</p>
                    </div>
                    <p className="text-xs text-gray-400 mt-1 ml-1">{formatTimeAgo(comment.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* View All Comments Button */}
          {(post.comment_count || 0) > (displayComments?.length || 0) && (
            <button
              onClick={handleViewAllComments}
              className="w-full mt-3 py-2 text-sm text-gray-500 hover:text-[#ff7eb6] hover:bg-white rounded-xl transition-all"
            >
              View all {post.comment_count} comments
            </button>
          )}
        </div>
      )}
    </div>
  )
}
