"""
Community Board API Test Script
Tests all community endpoints: posts, comments, reactions

Usage:
    # Default (localhost:8000)
    python test_community.py
    
    # With custom backend URL (e.g., Ngrok)
    set API_BASE_URL=https://your-ngrok-url.ngrok.io
    python test_community.py
    
    # Or modify BASE_URL below directly
"""
import requests
import json
from datetime import datetime
import os
import sys

# Configuration - modify these or use environment variables
# Option 1: Modify this line directly
BASE_URL = os.getenv("API_BASE_URL", "https://tasty-zebras-move.loca.lt")

# Option 2: Uncomment and modify this for Ngrok
# BASE_URL = "https://your-ngrok-url.ngrok.io"

API_URL = f"{BASE_URL}/community"

print(f"🔧 Using API URL: {BASE_URL}")
print(f"   Set API_BASE_URL env var to change this\n")

# Test credentials (you need to register/login first to get a valid token)
TEST_EMAIL = "test@example.com"
TEST_PASSWORD = "testpassword123"

def get_auth_token():
    """Get authentication token by logging in"""
    try:
        response = requests.post(
            f"{BASE_URL}/auth/login",
            data={
                "username": TEST_EMAIL,
                "password": TEST_PASSWORD
            }
        )
        if response.status_code == 200:
            data = response.json()
            token = data.get("access_token")
            print(f"✅ Login successful, got token")
            return token
        else:
            print(f"❌ Login failed: {response.status_code}")
            print(f"Response: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Login error: {e}")
        return None

def test_create_post(token, title, content, category="General", is_anonymous=False):
    """Test creating a new post"""
    print(f"\n📝 Testing CREATE POST: {title[:50]}...")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "69420"
    }
    
    payload = {
        "title": title,
        "content": content,
        "category": category,
        "is_anonymous": is_anonymous
    }
    
    try:
        response = requests.post(
            f"{API_URL}/posts",
            headers=headers,
            json=payload
        )
        
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Post created successfully! ID: {data.get('id')}")
            print(f"   Title: {data.get('title')}")
            print(f"   Category: {data.get('category')}")
            print(f"   Anonymous: {data.get('author', {}).get('is_anonymous')}")
            return data.get('id')
        elif response.status_code == 400:
            error_data = response.json()
            print(f"🚫 Post blocked by AI moderation")
            print(f"   Error: {error_data.get('detail')}")
            return None
        else:
            print(f"❌ Failed to create post")
            print(f"Response: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

def test_list_posts(token, category=None):
    """Test listing posts"""
    print(f"\n📋 Testing LIST POSTS...")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "ngrok-skip-browser-warning": "69420"
    }
    
    params = {"page": 1, "per_page": 10}
    if category:
        params["category"] = category
    
    try:
        response = requests.get(
            f"{API_URL}/posts",
            headers=headers,
            params=params
        )
        
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            posts = data.get('posts', [])
            total = data.get('total', 0)
            print(f"✅ Found {total} posts (showing {len(posts)})")
            
            for post in posts[:3]:  # Show first 3 posts
                print(f"   • [{post.get('category')}] {post.get('title')[:40]}...")
                print(f"     by {post.get('author', {}).get('display_name')} | {post.get('comment_count')} comments | {sum(post.get('reactions', {}).values())} reactions")
            
            return posts
        else:
            print(f"❌ Failed to list posts")
            print(f"Response: {response.text}")
            return []
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return []

def test_get_post_detail(token, post_id):
    """Test getting single post details"""
    print(f"\n🔍 Testing GET POST DETAIL: ID {post_id}")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "ngrok-skip-browser-warning": "69420"
    }
    
    try:
        response = requests.get(
            f"{API_URL}/posts/{post_id}",
            headers=headers
        )
        
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Post found!")
            print(f"   Title: {data.get('title')}")
            print(f"   Content: {data.get('content')[:100]}...")
            print(f"   Author: {data.get('author', {}).get('display_name')}")
            print(f"   Comments: {len(data.get('comments', []))}")
            print(f"   Reactions: {data.get('reactions')}")
            return data
        else:
            print(f"❌ Failed to get post")
            print(f"Response: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

def test_add_comment(token, post_id, content, is_anonymous=False):
    """Test adding a comment"""
    print(f"\n💬 Testing ADD COMMENT to post {post_id}")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "69420"
    }
    
    payload = {
        "content": content,
        "is_anonymous": is_anonymous
    }
    
    try:
        response = requests.post(
            f"{API_URL}/posts/{post_id}/comments",
            headers=headers,
            json=payload
        )
        
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Comment added! ID: {data.get('id')}")
            print(f"   Author: {data.get('author', {}).get('display_name')}")
            return data.get('id')
        elif response.status_code == 400:
            error_data = response.json()
            print(f"🚫 Comment blocked by AI moderation")
            print(f"   Error: {error_data.get('detail')}")
            return None
        else:
            print(f"❌ Failed to add comment")
            print(f"Response: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

def test_add_reaction(token, post_id, reaction_type="hug"):
    """Test adding a reaction"""
    print(f"\n❤️ Testing ADD REACTION '{reaction_type}' to post {post_id}")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "69420"
    }
    
    payload = {"reaction_type": reaction_type}
    
    try:
        response = requests.post(
            f"{API_URL}/posts/{post_id}/react",
            headers=headers,
            json=payload
        )
        
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            reactions = data.get('reactions', {})
            total = sum(reactions.values())
            print(f"✅ Reaction added!")
            print(f"   Total reactions: {total}")
            print(f"   Breakdown: 🫂{reactions.get('hug', 0)} ✋{reactions.get('me_too', 0)} 💪{reactions.get('support', 0)} 🎉{reactions.get('celebrate', 0)}")
            return True
        else:
            print(f"❌ Failed to add reaction")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_remove_reaction(token, post_id):
    """Test removing a reaction"""
    print(f"\n💔 Testing REMOVE REACTION from post {post_id}")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "ngrok-skip-browser-warning": "69420"
    }
    
    try:
        response = requests.delete(
            f"{API_URL}/posts/{post_id}/react",
            headers=headers
        )
        
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ {data.get('message', 'Reaction removed')}")
            return True
        else:
            print(f"❌ Failed to remove reaction")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_moderation_blocking(token):
    """Test that AI moderation blocks inappropriate content"""
    print(f"\n🛡️ Testing AI MODERATION (should block inappropriate content)")
    
    # This content should be blocked by AI moderation
    inappropriate_title = "Hate speech and bullying content"
    inappropriate_content = "This is hate speech and bullying. You are stupid and worthless. Everyone should hurt themselves."
    
    result = test_create_post(token, inappropriate_title, inappropriate_content)
    
    if result is None:
        print("✅ AI Moderation is working correctly - blocked inappropriate content")
        return True
    else:
        print("⚠️ AI Moderation might not be working - content was not blocked")
        return False

def run_all_tests():
    """Run complete test suite"""
    print("=" * 60)
    print("🧪 COMMUNITY BOARD API TEST SUITE")
    print("=" * 60)
    print(f"Base URL: {BASE_URL}")
    print(f"Test User: {TEST_EMAIL}")
    print("=" * 60)
    
    # Get auth token
    token = get_auth_token()
    if not token:
        print("\n⚠️  Could not get auth token. Make sure:")
        print("   1. Backend server is running")
        print("   2. User is registered (run register first)")
        print(f"\n   Register with: POST {BASE_URL}/auth/register")
        print(f"   Body: {{'email': '{TEST_EMAIL}', 'password': '{TEST_PASSWORD}'}}")
        return
    
    created_posts = []
    
    # Test 1: Create normal post
    post_id = test_create_post(
        token,
        "My First Period Experience",
        "Hi everyone! I'm new here and wanted to share my experience. I've been tracking my cycle for 3 months now and it's been really helpful. Has anyone else noticed their symptoms improving with tracking?",
        "General",
        False
    )
    if post_id:
        created_posts.append(post_id)
    
    # Test 2: Create anonymous post
    anon_post_id = test_create_post(
        token,
        "Anonymous: Dealing with PCOS",
        "I've been struggling with PCOS for years. The irregular cycles are so frustrating. Has anyone found natural remedies that help with symptoms? I'd love to hear your experiences.",
        "PCOS",
        True
    )
    if anon_post_id:
        created_posts.append(anon_post_id)
    
    # Test 3: Create post in different categories
    tips_post_id = test_create_post(
        token,
        "Tips for Managing Cramps",
        "Here are some tips that have helped me: 1) Heat pad on lower abdomen, 2) Gentle yoga stretches, 3) Staying hydrated, 4) Magnesium supplements. What works for you?",
        "Tips",
        False
    )
    if tips_post_id:
        created_posts.append(tips_post_id)
    
    # Test 4: List all posts
    posts = test_list_posts(token)
    
    # Test 5: List posts by category
    test_list_posts(token, category="PCOS")
    
    # Test 6: Get post detail (if we have any posts)
    if created_posts:
        test_get_post_detail(token, created_posts[0])
    
    # Test 7: Add comments
    if created_posts:
        test_add_comment(
            token,
            created_posts[0],
            "Thanks for sharing! This is really helpful. 💕",
            False
        )
        
        test_add_comment(
            token,
            created_posts[0],
            "I can relate to this so much. Thanks for being brave enough to share!",
            True  # Anonymous comment
        )
    
    # Test 8: Add reactions
    if created_posts:
        test_add_reaction(token, created_posts[0], "hug")
        test_add_reaction(token, created_posts[0], "support")
        
        # Test removing reaction
        test_remove_reaction(token, created_posts[0])
    
    # Test 9: AI Moderation (optional - only if you want to test blocking)
    # Uncomment to test:
    # test_moderation_blocking(token)
    
    print("\n" + "=" * 60)
    print("✅ TEST SUITE COMPLETED")
    print("=" * 60)
    print(f"Created posts: {len(created_posts)}")
    print(f"Post IDs: {created_posts}")

if __name__ == "__main__":
    run_all_tests()
