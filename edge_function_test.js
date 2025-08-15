// ==========================================
// EDGE FUNCTION COMPREHENSIVE TEST
// Test the super-action edge function deployment
// Run this in browser console or Node.js
// ==========================================

const SUPABASE_URL = 'https://yqnikgupiaghgjtsaypr.supabase.co';
const EDGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/super-action`;

class EdgeFunctionTester {
    constructor() {
        this.results = [];
        this.testCount = 0;
        this.passCount = 0;
        this.failCount = 0;
    }

    log(testName, status, details = '') {
        this.testCount++;
        if (status === 'PASS') this.passCount++;
        if (status === 'FAIL') this.failCount++;
        
        const result = {
            test: testName,
            status: status,
            details: details,
            timestamp: new Date().toISOString()
        };
        
        this.results.push(result);
        console.log(`${status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️'} ${testName}: ${details}`);
    }

    async testEdgeFunctionDeployment() {
        console.log('🚀 Starting Edge Function Comprehensive Test...\n');

        // Test 1: Check if function responds to OPTIONS (CORS)
        try {
            const response = await fetch(EDGE_FUNCTION_URL, {
                method: 'OPTIONS',
                headers: {
                    'Origin': 'http://localhost:3000',
                    'Access-Control-Request-Method': 'POST',
                    'Access-Control-Request-Headers': 'Content-Type'
                }
            });

            if (response.status === 200) {
                this.log('edge_function.cors_support', 'PASS', 'CORS preflight working');
            } else {
                this.log('edge_function.cors_support', 'FAIL', `CORS returned ${response.status}`);
            }
        } catch (error) {
            this.log('edge_function.cors_support', 'FAIL', `CORS failed: ${error.message}`);
        }

        // Test 2: Test basic ping functionality
        try {
            const response = await fetch(EDGE_FUNCTION_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'ping'
                })
            });

            if (response.status === 200) {
                const data = await response.json();
                if (data.success && data.data.message) {
                    this.log('edge_function.ping_test', 'PASS', 'Ping functionality working');
                } else {
                    this.log('edge_function.ping_test', 'FAIL', 'Ping returned unexpected format');
                }
            } else {
                this.log('edge_function.ping_test', 'FAIL', `Ping returned ${response.status}`);
            }
        } catch (error) {
            this.log('edge_function.ping_test', 'FAIL', `Ping failed: ${error.message}`);
        }

        // Test 3: Test status functionality
        try {
            const response = await fetch(EDGE_FUNCTION_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'status'
                })
            });

            if (response.status === 200) {
                const data = await response.json();
                if (data.success && data.data.status === 'operational') {
                    this.log('edge_function.status_test', 'PASS', 'Status endpoint working');
                } else {
                    this.log('edge_function.status_test', 'FAIL', 'Status returned unexpected format');
                }
            } else {
                this.log('edge_function.status_test', 'FAIL', `Status returned ${response.status}`);
            }
        } catch (error) {
            this.log('edge_function.status_test', 'FAIL', `Status failed: ${error.message}`);
        }

        // Test 4: Test error handling
        try {
            const response = await fetch(EDGE_FUNCTION_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'nonexistent_action'
                })
            });

            if (response.status === 200) {
                const data = await response.json();
                if (data.success && data.data.message.includes('not implemented')) {
                    this.log('edge_function.error_handling', 'PASS', 'Error handling working correctly');
                } else {
                    this.log('edge_function.error_handling', 'WARN', 'Unexpected error response format');
                }
            } else {
                this.log('edge_function.error_handling', 'FAIL', `Error test returned ${response.status}`);
            }
        } catch (error) {
            this.log('edge_function.error_handling', 'FAIL', `Error test failed: ${error.message}`);
        }

        // Test 5: Test malformed request handling
        try {
            const response = await fetch(EDGE_FUNCTION_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: 'invalid json'
            });

            if (response.status === 500) {
                const data = await response.json();
                if (!data.success) {
                    this.log('edge_function.malformed_request', 'PASS', 'Malformed requests handled properly');
                } else {
                    this.log('edge_function.malformed_request', 'FAIL', 'Should have failed with malformed JSON');
                }
            } else {
                this.log('edge_function.malformed_request', 'FAIL', `Expected 500, got ${response.status}`);
            }
        } catch (error) {
            this.log('edge_function.malformed_request', 'PASS', 'Malformed request properly rejected');
        }

        // Test 6: Performance test
        try {
            const startTime = Date.now();
            const response = await fetch(EDGE_FUNCTION_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'ping'
                })
            });
            const endTime = Date.now();
            const responseTime = endTime - startTime;

            if (response.status === 200 && responseTime < 5000) {
                this.log('edge_function.performance', 'PASS', `Response time: ${responseTime}ms`);
            } else if (response.status === 200) {
                this.log('edge_function.performance', 'WARN', `Slow response: ${responseTime}ms`);
            } else {
                this.log('edge_function.performance', 'FAIL', `Performance test failed with ${response.status}`);
            }
        } catch (error) {
            this.log('edge_function.performance', 'FAIL', `Performance test failed: ${error.message}`);
        }

        this.generateReport();
    }

    generateReport() {
        console.log('\n==========================================');
        console.log('EDGE FUNCTION TEST RESULTS');
        console.log('==========================================\n');

        // Detailed results
        this.results.forEach(result => {
            const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️';
            console.log(`${icon} ${result.test}: ${result.details}`);
        });

        console.log('\n==========================================');
        console.log('SUMMARY');
        console.log('==========================================');
        console.log(`Total Tests: ${this.testCount}`);
        console.log(`✅ Passed: ${this.passCount}`);
        console.log(`⚠️ Warnings: ${this.testCount - this.passCount - this.failCount}`);
        console.log(`❌ Failed: ${this.failCount}`);

        const successRate = ((this.passCount / this.testCount) * 100).toFixed(1);
        console.log(`\nSuccess Rate: ${successRate}%`);

        if (this.failCount === 0) {
            console.log('\n🎉 Edge Function is fully operational!');
        } else if (this.failCount <= 1) {
            console.log('\n⚠️ Edge Function mostly working with minor issues');
        } else {
            console.log('\n❌ Edge Function has significant issues');
        }

        return {
            totalTests: this.testCount,
            passed: this.passCount,
            failed: this.failCount,
            successRate: parseFloat(successRate),
            results: this.results
        };
    }
}

// Auto-run the test if in browser environment
if (typeof window !== 'undefined') {
    console.log('🌐 Running in browser environment');
    const tester = new EdgeFunctionTester();
    tester.testEdgeFunctionDeployment();
} else {
    console.log('📦 Export available for Node.js');
    module.exports = EdgeFunctionTester;
}
