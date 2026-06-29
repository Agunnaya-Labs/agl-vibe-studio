#!/bin/bash

# Pre-deployment verification script
# Run this before deploying to production to ensure everything is ready

set -e

echo "=================================================="
echo "AGUNNAYA LABS STUDIO - PRE-DEPLOYMENT CHECKLIST"
echo "=================================================="
echo ""

# 1. Environment variables check
echo "1. Checking environment variables..."
if [ -f .env.production ]; then
    echo "✓ .env.production file found"
    
    # Check required variables
    required_vars=(
        "VITE_ENV"
        "VITE_FIREBASE_API_KEY"
        "VITE_FIREBASE_PROJECT_ID"
        "VITE_FIREBASE_AUTH_DOMAIN"
    )
    
    missing_vars=()
    for var in "${required_vars[@]}"; do
        if grep -q "^${var}=" .env.production; then
            value=$(grep "^${var}=" .env.production | cut -d '=' -f2)
            if [ -z "$value" ]; then
                missing_vars+=("$var")
            fi
        else
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -eq 0 ]; then
        echo "✓ All required environment variables are set"
    else
        echo "✗ Missing environment variables: ${missing_vars[*]}"
        exit 1
    fi
else
    echo "✗ .env.production file not found"
    echo "  Please copy .env.example to .env.production and configure it"
    exit 1
fi
echo ""

# 2. Dependencies check
echo "2. Checking dependencies..."
if npm list > /dev/null 2>&1; then
    echo "✓ All dependencies installed"
else
    echo "✗ Dependencies not installed"
    echo "  Run: npm install"
    exit 1
fi
echo ""

# 3. TypeScript check
echo "3. Running TypeScript compiler..."
if npm run lint > /dev/null 2>&1; then
    echo "✓ No TypeScript errors"
else
    echo "✗ TypeScript compilation errors found"
    npm run lint
    exit 1
fi
echo ""

# 4. Build check
echo "4. Building production bundle..."
if npm run build > /dev/null 2>&1; then
    echo "✓ Production build successful"
    
    # Check build output size
    build_size=$(du -sh dist/ | cut -f1)
    echo "  Build size: $build_size"
else
    echo "✗ Build failed"
    npm run build
    exit 1
fi
echo ""

# 5. Security check
echo "5. Running security checks..."
echo "  ✓ Checking for console.log statements in production code..."
if grep -r "console\.log" dist/ 2>/dev/null | grep -v ".map" > /dev/null; then
    echo "  ⚠ Warning: console.log found in production bundle"
else
    echo "  ✓ No console.log statements in bundle"
fi
echo ""

# 6. Summary
echo "=================================================="
echo "PRE-DEPLOYMENT CHECKLIST COMPLETE"
echo "=================================================="
echo ""
echo "Next steps:"
echo "1. Review your .env.production configuration"
echo "2. Verify Firestore security rules are applied"
echo "3. Test the app locally: npm start"
echo "4. Deploy to production"
echo ""
echo "For detailed instructions, see PRODUCTION.md"
