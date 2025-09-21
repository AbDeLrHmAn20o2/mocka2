# =============================================
# Mocko Designs - Production Testing Suite
# =============================================

import requests
import time
import json
import sys
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed
import threading

class ProductionTester:
    def __init__(self, base_url="http://localhost:5000", frontend_url="http://localhost:3000"):
        self.base_url = base_url
        self.frontend_url = frontend_url
        self.session = requests.Session()
        self.test_results = []
        self.lock = threading.Lock()
        
    def log_result(self, test_name, status, message, duration=None):
        """Log test result with thread safety"""
        with self.lock:
            result = {
                "test": test_name,
                "status": status,
                "message": message,
                "duration": duration,
                "timestamp": datetime.now().isoformat()
            }
            self.test_results.append(result)
            
            # Color coding for console output
            color = "\033[92m" if status == "PASS" else "\033[91m"  # Green for pass, red for fail
            reset = "\033[0m"
            duration_str = f" ({duration:.2f}s)" if duration else ""
            print(f"{color}[{status}]{reset} {test_name}: {message}{duration_str}")
    
    def test_health_endpoint(self):
        """Test basic health endpoint"""
        start_time = time.time()
        try:
            response = self.session.get(f"{self.base_url}/health", timeout=10)
            duration = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "healthy":
                    self.log_result("Health Check", "PASS", "Service is healthy", duration)
                else:
                    self.log_result("Health Check", "FAIL", f"Unhealthy status: {data}", duration)
            else:
                self.log_result("Health Check", "FAIL", f"HTTP {response.status_code}", duration)
        except Exception as e:
            duration = time.time() - start_time
            self.log_result("Health Check", "FAIL", f"Exception: {str(e)}", duration)
    
    def test_cors_headers(self):
        """Test CORS configuration"""
        start_time = time.time()
        try:
            headers = {
                "Origin": "https://mocko-designs.vercel.app",
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "Content-Type, Authorization"
            }
            
            response = self.session.options(f"{self.base_url}/api/v1/designs", headers=headers, timeout=10)
            duration = time.time() - start_time
            
            cors_headers = {
                "Access-Control-Allow-Origin": response.headers.get("Access-Control-Allow-Origin"),
                "Access-Control-Allow-Methods": response.headers.get("Access-Control-Allow-Methods"),
                "Access-Control-Allow-Headers": response.headers.get("Access-Control-Allow-Headers")
            }
            
            if cors_headers["Access-Control-Allow-Origin"]:
                self.log_result("CORS Configuration", "PASS", f"CORS headers present: {cors_headers}", duration)
            else:
                self.log_result("CORS Configuration", "FAIL", "Missing CORS headers", duration)
                
        except Exception as e:
            duration = time.time() - start_time
            self.log_result("CORS Configuration", "FAIL", f"Exception: {str(e)}", duration)
    
    def test_api_endpoints(self):
        """Test main API endpoints"""
        endpoints = [
            ("/api/v1/designs", "GET", "Designs endpoint"),
            ("/api/v1/templates", "GET", "Templates endpoint"),
            ("/api/v1/fonts", "GET", "Fonts endpoint"),
            ("/api/v1/auth/me", "GET", "Auth endpoint")
        ]
        
        for path, method, description in endpoints:
            start_time = time.time()
            try:
                if method == "GET":
                    response = self.session.get(f"{self.base_url}{path}", timeout=10)
                elif method == "POST":
                    response = self.session.post(f"{self.base_url}{path}", json={}, timeout=10)
                
                duration = time.time() - start_time
                
                if response.status_code in [200, 401, 403]:  # 401/403 are ok for auth endpoints
                    self.log_result(f"API {description}", "PASS", f"HTTP {response.status_code}", duration)
                else:
                    self.log_result(f"API {description}", "FAIL", f"HTTP {response.status_code}", duration)
                    
            except Exception as e:
                duration = time.time() - start_time
                self.log_result(f"API {description}", "FAIL", f"Exception: {str(e)}", duration)
    
    def test_rate_limiting(self):
        """Test rate limiting functionality"""
        start_time = time.time()
        try:
            # Make rapid requests to trigger rate limiting
            responses = []
            for i in range(12):  # Should trigger rate limit at 10 requests
                response = self.session.get(f"{self.base_url}/health")
                responses.append(response.status_code)
            
            duration = time.time() - start_time
            
            if 429 in responses:  # Too Many Requests
                self.log_result("Rate Limiting", "PASS", "Rate limiting is working", duration)
            else:
                self.log_result("Rate Limiting", "FAIL", f"No rate limiting detected: {responses}", duration)
                
        except Exception as e:
            duration = time.time() - start_time
            self.log_result("Rate Limiting", "FAIL", f"Exception: {str(e)}", duration)
    
    def test_security_headers(self):
        """Test security headers"""
        start_time = time.time()
        try:
            response = self.session.get(f"{self.base_url}/health", timeout=10)
            duration = time.time() - start_time
            
            security_headers = {
                "X-Content-Type-Options": response.headers.get("X-Content-Type-Options"),
                "X-Frame-Options": response.headers.get("X-Frame-Options"),
                "X-XSS-Protection": response.headers.get("X-XSS-Protection"),
                "Strict-Transport-Security": response.headers.get("Strict-Transport-Security")
            }
            
            missing_headers = [k for k, v in security_headers.items() if not v]
            
            if not missing_headers:
                self.log_result("Security Headers", "PASS", "All security headers present", duration)
            else:
                self.log_result("Security Headers", "FAIL", f"Missing headers: {missing_headers}", duration)
                
        except Exception as e:
            duration = time.time() - start_time
            self.log_result("Security Headers", "FAIL", f"Exception: {str(e)}", duration)
    
    def test_frontend_accessibility(self):
        """Test frontend accessibility"""
        start_time = time.time()
        try:
            response = self.session.get(self.frontend_url, timeout=15)
            duration = time.time() - start_time
            
            if response.status_code == 200:
                content = response.text
                
                # Check for basic accessibility features
                accessibility_checks = {
                    "Meta viewport": 'name="viewport"' in content,
                    "Title tag": '<title>' in content,
                    "Language attribute": 'lang=' in content,
                    "Alt attributes": 'alt=' in content
                }
                
                passed_checks = sum(accessibility_checks.values())
                total_checks = len(accessibility_checks)
                
                if passed_checks == total_checks:
                    self.log_result("Frontend Accessibility", "PASS", f"All {total_checks} checks passed", duration)
                else:
                    failed = [k for k, v in accessibility_checks.items() if not v]
                    self.log_result("Frontend Accessibility", "FAIL", f"Failed: {failed}", duration)
            else:
                self.log_result("Frontend Accessibility", "FAIL", f"HTTP {response.status_code}", duration)
                
        except Exception as e:
            duration = time.time() - start_time
            self.log_result("Frontend Accessibility", "FAIL", f"Exception: {str(e)}", duration)
    
    def test_performance_metrics(self):
        """Test performance metrics"""
        start_time = time.time()
        try:
            # Test API response times
            api_times = []
            for i in range(5):
                api_start = time.time()
                response = self.session.get(f"{self.base_url}/health")
                api_times.append(time.time() - api_start)
            
            avg_api_time = sum(api_times) / len(api_times)
            
            # Test frontend load time
            frontend_start = time.time()
            response = self.session.get(self.frontend_url)
            frontend_time = time.time() - frontend_start
            
            duration = time.time() - start_time
            
            # Performance thresholds
            if avg_api_time < 0.5 and frontend_time < 3.0:
                self.log_result("Performance", "PASS", 
                              f"API: {avg_api_time:.2f}s, Frontend: {frontend_time:.2f}s", duration)
            else:
                self.log_result("Performance", "FAIL", 
                              f"Slow response - API: {avg_api_time:.2f}s, Frontend: {frontend_time:.2f}s", duration)
                
        except Exception as e:
            duration = time.time() - start_time
            self.log_result("Performance", "FAIL", f"Exception: {str(e)}", duration)
    
    def test_concurrent_load(self):
        """Test concurrent load handling"""
        start_time = time.time()
        
        def make_request():
            try:
                response = self.session.get(f"{self.base_url}/health")
                return response.status_code
            except:
                return 500
        
        try:
            # Simulate 20 concurrent users
            with ThreadPoolExecutor(max_workers=20) as executor:
                futures = [executor.submit(make_request) for _ in range(20)]
                results = [future.result() for future in as_completed(futures)]
            
            duration = time.time() - start_time
            
            success_rate = (results.count(200) / len(results)) * 100
            
            if success_rate >= 95:
                self.log_result("Concurrent Load", "PASS", 
                              f"{success_rate:.1f}% success rate with 20 concurrent users", duration)
            else:
                self.log_result("Concurrent Load", "FAIL", 
                              f"Only {success_rate:.1f}% success rate", duration)
                
        except Exception as e:
            duration = time.time() - start_time
            self.log_result("Concurrent Load", "FAIL", f"Exception: {str(e)}", duration)
    
    def test_international_support(self):
        """Test international/multi-region support"""
        start_time = time.time()
        try:
            # Test with various Accept-Language headers
            languages = ["en-US", "es-ES", "fr-FR", "de-DE", "ja-JP", "zh-CN"]
            results = []
            
            for lang in languages:
                headers = {"Accept-Language": lang}
                response = self.session.get(f"{self.base_url}/health", headers=headers, timeout=10)
                results.append(response.status_code == 200)
            
            duration = time.time() - start_time
            
            if all(results):
                self.log_result("International Support", "PASS", 
                              f"Supports {len(languages)} language headers", duration)
            else:
                failed_langs = [lang for lang, result in zip(languages, results) if not result]
                self.log_result("International Support", "FAIL", 
                              f"Failed for languages: {failed_langs}", duration)
                
        except Exception as e:
            duration = time.time() - start_time
            self.log_result("International Support", "FAIL", f"Exception: {str(e)}", duration)
    
    def run_all_tests(self):
        """Run all tests and generate report"""
        print("🧪 Starting Production Testing Suite for Mocko Designs")
        print("=" * 60)
        
        test_suite = [
            self.test_health_endpoint,
            self.test_cors_headers,
            self.test_api_endpoints,
            self.test_security_headers,
            self.test_rate_limiting,
            self.test_frontend_accessibility,
            self.test_performance_metrics,
            self.test_concurrent_load,
            self.test_international_support
        ]
        
        for test in test_suite:
            test()
            time.sleep(0.5)  # Brief pause between tests
        
        # Generate summary report
        self.generate_report()
    
    def generate_report(self):
        """Generate test report"""
        print("\n" + "=" * 60)
        print("📊 TEST RESULTS SUMMARY")
        print("=" * 60)
        
        passed = len([r for r in self.test_results if r["status"] == "PASS"])
        failed = len([r for r in self.test_results if r["status"] == "FAIL"])
        total = len(self.test_results)
        
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print(f"📈 Success Rate: {(passed/total)*100:.1f}%")
        
        if failed > 0:
            print("\n🔍 FAILED TESTS:")
            for result in self.test_results:
                if result["status"] == "FAIL":
                    print(f"   ❌ {result['test']}: {result['message']}")
        
        # Save detailed report
        with open("test_report.json", "w") as f:
            json.dump({
                "summary": {
                    "total": total,
                    "passed": passed,
                    "failed": failed,
                    "success_rate": (passed/total)*100
                },
                "details": self.test_results,
                "timestamp": datetime.now().isoformat()
            }, f, indent=2)
        
        print(f"\n📄 Detailed report saved to: test_report.json")
        
        if failed == 0:
            print("\n🎉 All tests passed! Ready for production deployment.")
            return True
        else:
            print(f"\n⚠️ {failed} tests failed. Please fix issues before deployment.")
            return False

def main():
    """Main function to run tests"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Mocko Designs Production Testing Suite")
    parser.add_argument("--backend", default="http://localhost:5000", help="Backend URL")
    parser.add_argument("--frontend", default="http://localhost:3000", help="Frontend URL")
    
    args = parser.parse_args()
    
    tester = ProductionTester(args.backend, args.frontend)
    success = tester.run_all_tests()
    
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()