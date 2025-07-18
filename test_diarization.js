#!/usr/bin/env node

/**
 * Simple test script to verify diarization commands work
 * Run this while the Tauri dev server is running
 */

import { invoke } from '@tauri-apps/api/core';

console.log('🔍 Testing Speaker Diarization Commands...\n');

async function testPythonBridge() {
    try {
        console.log('1. Testing Python bridge connectivity...');
        const result = await invoke('test_python_bridge');
        console.log('✅ Python bridge test:', result);
        return true;
    } catch (error) {
        console.error('❌ Python bridge test failed:', error);
        return false;
    }
}

async function testDependencies() {
    try {
        console.log('\n2. Checking diarization dependencies...');
        const result = await invoke('check_diarization_dependencies');
        console.log('✅ Dependencies check:', result);
        return true;
    } catch (error) {
        console.error('❌ Dependencies check failed:', error);
        return false;
    }
}

async function testDiarization(audioFile) {
    try {
        console.log(`\n3. Testing diarization on ${audioFile}...`);
        const options = {
            min_speakers: null,
            max_speakers: null,
            num_speakers: null,
            use_gpu: false, // Start with CPU to avoid GPU setup issues
            hf_token: null // We'll test without token first
        };
        
        const result = await invoke('run_speaker_diarization', {
            audioPath: audioFile,
            options: options
        });
        
        console.log('✅ Diarization completed successfully!');
        console.log('📊 Results:', JSON.stringify(result, null, 2));
        return true;
    } catch (error) {
        console.error('❌ Diarization failed:', error);
        return false;
    }
}

async function runTests() {
    // Test 1: Python bridge
    const pythonOk = await testPythonBridge();
    if (!pythonOk) {
        console.log('\n❌ Cannot proceed without working Python bridge');
        return;
    }
    
    // Test 2: Dependencies
    const depsOk = await testDependencies();
    if (!depsOk) {
        console.log('\n⚠️  Dependencies missing, but we can still try basic tests');
    }
    
    // Test 3: Try diarization with sample files
    const sampleFiles = [
        '/Users/tt/Workspace/Personal/whisperer/samples/multi.wav',
        '/Users/tt/Workspace/Personal/whisperer/samples/single.wav'
    ];
    
    for (const file of sampleFiles) {
        await testDiarization(file);
    }
    
    console.log('\n🎉 Testing completed!');
}

// Run the tests
runTests().catch(error => {
    console.error('💥 Test script failed:', error);
});