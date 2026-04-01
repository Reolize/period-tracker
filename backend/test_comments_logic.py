#!/usr/bin/env python3
"""
Backend API Test for Comments/Reply System
Tests: Create user -> Create post -> Add comment -> Add reply -> Delete parent -> Verify reply still exists
"""
import requests
import sys
import time

BASE_URL = "http://localhost:8000"

def log(msg):
    print(f"[TEST] {msg}")

def create_test_user():
    """Create a test user and return auth token"""
    timestamp = int(time.time())
    email = f"test_{timestamp}@example.com"
    password = "testpassword123"
    
    log(f"Creating test user: {email}")
    
    # Register user (JSON payload)
    resp = requests.post(f"{BASE_URL}/auth/register", json={
        "email": email,
        "password": password
    })
    
    if resp.status_code != 200:
        log(f"Failed to register: {resp.text}")
        return None
    
    log("User registered, now logging in...")
    
    # Login to get token (form data for OAuth2)
    resp = requests.post(f"{BASE_URL}/auth/login", data={
        "username": email,
        "password": password
    })
    
    if resp.status_code != 200:
        log(f"Failed to login: {resp.text}")
        return None
    
    token = resp.json().get("access_token")
    log(f"Got auth token: {token[:20]}...")
    return token

def create_test_post(token):
    """Create a test post"""
    log("Creating test post")
    
    headers = {"Authorization": f"Bearer {token}"}
    resp = requests.post(f"{BASE_URL}/community/posts", json={
        "title": "Test Post for Comment System",
        "content": "This is a test post to verify comment/reply functionality",
        "post_type": "general"
    }, headers=headers)
    
    if resp.status_code != 200:
        log(f"Failed to create post: {resp.text}")
        return None
    
    post_id = resp.json().get("id")
    log(f"Created post with ID: {post_id}")
    return post_id

def add_top_level_comment(token, post_id):
    """Add a top-level comment to a post"""
    log(f"Adding top-level comment to post {post_id}")
    
    headers = {"Authorization": f"Bearer {token}"}
    resp = requests.post(f"{BASE_URL}/community/posts/{post_id}/comments", json={
        "content": "This is a top-level comment"
    }, headers=headers)
    
    if resp.status_code != 200:
        log(f"Failed to add comment: {resp.text}")
        return None
    
    comment_id = resp.json().get("id")
    log(f"Created comment with ID: {comment_id}")
    return comment_id

def add_reply_comment(token, post_id, parent_id):
    """Add a reply (nested comment) using parent_id"""
    log(f"Adding reply to comment {parent_id}")
    
    headers = {"Authorization": f"Bearer {token}"}
    resp = requests.post(f"{BASE_URL}/community/posts/{post_id}/comments", json={
        "content": "This is a nested reply",
        "parent_id": parent_id
    }, headers=headers)
    
    if resp.status_code != 200:
        log(f"Failed to add reply: {resp.text}")
        return None
    
    reply_id = resp.json().get("id")
    log(f"Created reply with ID: {reply_id}")
    return reply_id

def delete_comment(token, comment_id):
    """Soft delete a comment"""
    log(f"Deleting comment {comment_id} (soft delete)")
    
    headers = {"Authorization": f"Bearer {token}"}
    resp = requests.delete(f"{BASE_URL}/community/comments/{comment_id}", headers=headers)
    
    if resp.status_code != 200:
        log(f"Failed to delete comment: {resp.text}")
        return None
    
    data = resp.json()
    log(f"Delete response: is_deleted={data.get('is_deleted')}, content={repr(data.get('content'))}")
    return data

def get_post_with_comments(token, post_id):
    """Fetch post with all comments and nested replies"""
    log(f"Fetching post {post_id} with comments")
    
    headers = {"Authorization": f"Bearer {token}"}
    resp = requests.get(f"{BASE_URL}/community/posts/{post_id}", headers=headers)
    
    if resp.status_code != 200:
        log(f"Failed to get post: {resp.text}")
        return None
    
    return resp.json()

def run_tests():
    """Run all tests in sequence"""
    log("=" * 60)
    log("Starting Comment/Reply System Backend Tests")
    log("=" * 60)
    
    # Step 1: Create test user
    token = create_test_user()
    if not token:
        log("❌ FAILED: Could not create test user")
        return False
    log("✅ Test user created")
    
    # Step 2: Create test post
    post_id = create_test_post(token)
    if not post_id:
        log("❌ FAILED: Could not create test post")
        return False
    log("✅ Test post created")
    
    # Step 3: Add top-level comment
    comment_id = add_top_level_comment(token, post_id)
    if not comment_id:
        log("❌ FAILED: Could not add top-level comment")
        return False
    log("✅ Top-level comment added")
    
    # Step 4: Add reply (nested comment)
    reply_id = add_reply_comment(token, post_id, comment_id)
    if not reply_id:
        log("❌ FAILED: Could not add reply")
        return False
    log("✅ Reply comment added")
    
    # Step 5: Delete the top-level comment (soft delete)
    delete_result = delete_comment(token, comment_id)
    if not delete_result:
        log("❌ FAILED: Could not delete comment")
        return False
    
    # Verify delete response
    if not delete_result.get("is_deleted"):
        log("❌ FAILED: Delete response shows is_deleted=False")
        return False
    if delete_result.get("content") != "":
        log(f"❌ FAILED: Delete response content should be empty, got: {repr(delete_result.get('content'))}")
        return False
    log("✅ Soft delete successful (is_deleted=True, content='')")
    
    # Step 6: Fetch post and verify structure
    post_data = get_post_with_comments(token, post_id)
    if not post_data:
        log("❌ FAILED: Could not fetch post")
        return False
    
    log("Verifying post data structure...")
    
    # Find the deleted parent comment
    comments = post_data.get("comments", [])
    parent_comment = None
    for c in comments:
        if c.get("id") == comment_id:
            parent_comment = c
            break
    
    if not parent_comment:
        log("❌ FAILED: Parent comment not found in post data")
        return False
    
    # Assertions
    log(f"Parent comment: is_deleted={parent_comment.get('is_deleted')}, content={repr(parent_comment.get('content'))}")
    
    if not parent_comment.get("is_deleted"):
        log("❌ FAILED: Parent comment should have is_deleted=True")
        return False
    log("✅ Parent comment has is_deleted=True")
    
    # Check if replies still exist
    replies = parent_comment.get("replies", [])
    log(f"Number of replies in parent: {len(replies)}")
    
    reply_found = False
    for reply in replies:
        if reply.get("id") == reply_id:
            reply_found = True
            log(f"Found reply: {reply.get('id')}, content={repr(reply.get('content'))}")
            break
    
    if not reply_found:
        log("❌ FAILED: Nested reply should still exist after parent deletion")
        return False
    log("✅ Nested reply still exists after parent deletion")
    
    # All tests passed
    log("=" * 60)
    log("✅ ALL TESTS PASSED!")
    log("=" * 60)
    return True

if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)
