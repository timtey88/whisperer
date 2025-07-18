use whisperer_core::diarization::check_dependencies;

fn main() {
    println!("Testing diarization dependency check...");
    
    match check_dependencies() {
        Ok(result) => {
            println!("✅ Dependency check successful:");
            println!("  - Dependencies OK: {}", result.dependencies_ok);
            println!("  - CUDA Available: {}", result.cuda_available);
            println!("  - PyTorch Version: {:?}", result.torch_version);
        }
        Err(e) => {
            println!("❌ Dependency check failed: {}", e);
        }
    }
}