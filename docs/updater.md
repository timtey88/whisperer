# Auto-Updater System

This document provides comprehensive information about Whisperer's auto-updater system, including how it works, how to configure it, and how to manage signing keys.

## Table of Contents

-   [Overview](#overview)
-   [How the Auto-Updater Works](#how-the-auto-updater-works)
-   [Platform Support](#platform-support)
-   [Configuration](#configuration)
-   [Public Key Management](#public-key-management)
-   [Developer Workflow](#developer-workflow)
-   [CI/CD Integration](#cicd-integration)
-   [Commands Reference](#commands-reference)
-   [Security Best Practices](#security-best-practices)
-   [Troubleshooting](#troubleshooting)

## Overview

Whisperer uses Tauri's built-in auto-updater system to deliver seamless updates to users. The updater:

-   **Automatically checks** for updates on app startup
-   **Downloads and verifies** updates using cryptographic signatures
-   **Provides a smooth update experience** with custom UI
-   **Ensures security** through Ed25519 signature verification
-   **Distributes updates** via GitHub releases

## How the Auto-Updater Works

### Update Process Flow

1. **Check Phase**: App queries GitHub releases API for newer versions
2. **Download Phase**: If update available, downloads signed update bundle
3. **Verification Phase**: Verifies signature using embedded public key
4. **Installation Phase**: Applies update and restarts app automatically

### Frontend Implementation

The update system is managed by `UpdateProvider` in `desktop/src/providers/UpdateProvider.tsx`:

-   **Update State Management**: Tracks update availability and progress
-   **User Interface**: Custom toast notifications and progress indicators
-   **Background Checking**: Automatic checks on app startup
-   **Manual Triggers**: Developers can trigger update checks manually

### Backend Integration

Updates are handled by Tauri's built-in updater plugin with:

-   **Signature Verification**: Uses minisign with Ed25519 keys
-   **Secure Downloads**: Only from configured endpoints
-   **Atomic Updates**: All-or-nothing installation process

## Platform Support

| Platform    | Auto-Update | Manual Required                     |
| ----------- | ----------- | ----------------------------------- |
| **Windows** | ✅ Enabled  | No                                  |
| **macOS**   | ✅ Enabled  | No                                  |
| **Linux**   | ❌ Disabled | Yes - Download new AppImage/package |

**Note**: Linux auto-updates are disabled due to package manager conflicts and sandboxing limitations.

## Configuration

### Tauri Configuration

Located in `desktop/src-tauri/tauri.conf.json`:

```json
{
	"plugins": {
		"updater": {
			"active": true,
			"endpoints": ["https://github.com/whisperer-dev/whisperer/releases/latest/download/latest.json"],
			"dialog": false,
			"pubkey": "..."
		}
	}
}
```

### Configuration Options

-   **`active`**: Enable/disable the updater
-   **`endpoints`**: Array of update manifest URLs (GitHub releases API)
-   **`dialog`**: Use system dialogs (`true`) or custom UI (`false`)
-   **`pubkey`**: Base64-encoded public key for signature verification

### Window Configuration

Updates are enabled per-platform in the window configuration:

```json
{
	"tauri": {
		"windows": [
			{
				"updaterEnabled": true // Only effective on Windows/macOS
			}
		]
	}
}
```

## Public Key Management

### Current Key Information

The project uses a minisign public key with the following details:

-   **Key ID**: `DA0EF34A36C5E103`
-   **Format**: minisign with Ed25519 signatures
-   **Storage**: Base64-encoded in `tauri.conf.json`

When decoded, the current public key is:

```
untrusted comment: minisign public key: DA0EF34A36C5E103
RWQD4cU2SvMO2vU9YlmVgp1+Bvy6odNN7PupDBD36lsly6At5V7d8AWA
```

### Generating New Key Pairs

#### Basic Key Generation

```bash
# Navigate to desktop directory
cd desktop

# Generate new key pair (interactive)
bunx tauri signer generate -w ~/.tauri/whisperer.key

# Generate with password
bunx tauri signer generate -w ~/.tauri/whisperer.key -p "your_secure_password"

# Generate for CI (no prompts)
bunx tauri signer generate -w ~/.tauri/whisperer.key --ci

# Force overwrite existing keys
bunx tauri signer generate -w ~/.tauri/whisperer.key --force
```

#### Key Files Created

After generation, you'll have:

-   **Private Key**: `~/.tauri/whisperer.key` (keep secret!)
-   **Public Key**: `~/.tauri/whisperer.key.pub` (safe to share)

### Extracting Public Key for Configuration

```bash
# View the raw public key
cat ~/.tauri/whisperer.key.pub

# Get base64 encoded version for tauri.conf.json
cat ~/.tauri/whisperer.key.pub | base64

# Example output:
# ...
```

### Updating Configuration with New Key

1. **Generate the key pair** (as shown above)
2. **Get the base64 encoded public key**:
    ```bash
    cat ~/.tauri/whisperer.key.pub | base64
    ```
3. **Update `tauri.conf.json`**:
    ```json
    {
    	"plugins": {
    		"updater": {
    			"pubkey": "..."
    		}
    	}
    }
    ```

## Developer Workflow

### Setting Up Updater for New Project

1. **Generate signing keys**:

    ```bash
    bunx tauri signer generate -w ~/.tauri/whisperer.key
    ```

2. **Configure public key**:

    ```bash
    # Get public key
    cat ~/.tauri/whisperer.key.pub | base64

    # Add to tauri.conf.json
    ```

3. **Set up GitHub secrets** (see CI/CD Integration section)

4. **Configure release endpoints** in `tauri.conf.json`

5. **Test update process** with a staging environment

### Release Process

1. **Update version numbers**:

    - `desktop/package.json`
    - `desktop/src-tauri/Cargo.toml`
    - `desktop/src-tauri/tauri.conf.json`

2. **Create and push git tag**:

    ```bash
    git tag v1.2.0
    git push origin v1.2.0
    ```

3. **GitHub Actions automatically**:

    - Builds signed binaries
    - Creates GitHub release
    - Uploads update manifests

4. **Users receive automatic notifications** within 24 hours

## CI/CD Integration

### Required GitHub Secrets

Configure these secrets in your GitHub repository settings:

| Secret Name          | Description                       | Example                             |
| -------------------- | --------------------------------- | ----------------------------------- |
| `TAURI_PRIVATE_KEY`  | Content of private key file       | Content of `~/.tauri/whisperer.key` |
| `TAURI_KEY_PASSWORD` | Password used when generating key | `your_secure_password`              |
| `GH_TOKEN`           | GitHub token for releases         | GitHub personal access token        |

### Environment Variables

The CI workflow supports these environment variables:

```yaml
env:
    TAURI_SIGNING_PRIVATE_KEY: ${{ secrets.TAURI_PRIVATE_KEY }}
    TAURI_SIGNING_PRIVATE_KEY_PASSWORD: ${{ secrets.TAURI_KEY_PASSWORD }}
    # Alternative: use file path instead
    TAURI_PRIVATE_KEY_PATH: ~/.tauri/whisperer.key
```

### GitHub Actions Workflow

The release workflow in `.github/workflows/release.yml`:

1. **Triggers** on git tag push
2. **Builds** signed binaries for all platforms
3. **Signs** update bundles with private key
4. **Creates** GitHub release with artifacts
5. **Uploads** update manifests for auto-updater

## Commands Reference

### Key Management

```bash
# Generate new key pair
bunx tauri signer generate -w ~/.tauri/whisperer.key

# Generate with specific password
bunx tauri signer generate -w ~/.tauri/whisperer.key -p "password"

# Generate for CI (no interactive prompts)
bunx tauri signer generate -w ~/.tauri/whisperer.key --ci

# Force overwrite existing keys
bunx tauri signer generate -w ~/.tauri/whisperer.key --force
```

### Signing Operations

```bash
# Sign update manually
bunx tauri signer sign -f ~/.tauri/whisperer.key -p "password" update.tar.gz

# Sign using environment variables
export TAURI_PRIVATE_KEY="$(cat ~/.tauri/whisperer.key)"
export TAURI_PRIVATE_KEY_PASSWORD="password"
bunx tauri signer sign update.tar.gz

# Verify signature
bunx tauri signer verify update.tar.gz.sig -f ~/.tauri/whisperer.key.pub
```

### Development Testing

```bash
# Build with updater enabled
bunx tauri build

# Test update checking
bunx tauri dev

# Build specific platform
bunx tauri build --target x86_64-pc-windows-msvc
```

## Security Best Practices

### Private Key Security

-   **🔒 Never commit private keys** to version control
-   **💾 Backup private keys securely** in multiple locations
-   **🔐 Use strong passwords** for key generation
-   **👥 Limit access** to private keys (only CI and key maintainers)
-   **🔄 Rotate keys periodically** for enhanced security

### Key Storage Recommendations

| Environment           | Storage Method             | Security Level |
| --------------------- | -------------------------- | -------------- |
| **Local Development** | `~/.tauri/` directory      | Medium         |
| **CI/CD**             | GitHub repository secrets  | High           |
| **Backup**            | Encrypted external storage | Very High      |
| **Team Sharing**      | Encrypted password manager | High           |

### Key Rotation Process

1. **Generate new key pair**
2. **Update `tauri.conf.json` with new public key**
3. **Update CI secrets with new private key**
4. **Release new version with updated key**
5. **Securely destroy old private key**

**⚠️ Important**: Key rotation requires users to manually download one update, as the old key cannot verify the new signature.

### CI/CD Security

-   **🛡️ Use repository secrets** for sensitive data
-   **🔒 Enable branch protection** for release branches
-   **👀 Monitor release workflows** for unauthorized changes
-   **🔐 Use minimal permissions** for GitHub tokens
-   **📝 Audit access logs** regularly

## Troubleshooting

### Common Issues

#### Update Check Fails

**Symptoms**: No update notifications appear

**Solutions**:

-   Check internet connection
-   Verify GitHub releases are public
-   Confirm endpoint URLs in `tauri.conf.json`
-   Check GitHub API rate limits

#### Signature Verification Fails

**Symptoms**: Update downloads but fails to install

**Solutions**:

-   Verify public key in `tauri.conf.json` matches signing key
-   Check private key password in CI secrets
-   Ensure releases are properly signed
-   Validate base64 encoding of public key

#### Platform-Specific Issues

**Windows**:

-   Ensure `.msi` installer is signed
-   Check Windows Defender exclusions
-   Verify updater is enabled in window config

**macOS**:

-   Confirm app is properly notarized
-   Check Gatekeeper settings
-   Verify code signing certificates

**Linux**:

-   Auto-updates are disabled by design
-   Users must manually download new versions
-   Consider AppImage or package manager distribution

### Debug Commands

```bash
# Check key validity
bunx tauri signer verify --help

# Test key generation
bunx tauri signer generate --help

# Validate configuration
bunx tauri info

# Build with verbose output
bunx tauri build --verbose
```

### Log Analysis

Check application logs for updater-related messages:

```bash
# macOS logs location
~/Library/Logs/whisperer/

# Windows logs location
%APPDATA%\whisperer\logs\

# Linux logs location (if applicable)
~/.local/share/whisperer/logs/
```

### Recovery Scenarios

#### Lost Private Key

If private key is lost:

1. **Generate new key pair**
2. **Update configuration with new public key**
3. **Release new version (users must manually download)**
4. **Future updates will work automatically**

#### Compromised Private Key

If private key is compromised:

1. **Immediately generate new key pair**
2. **Update CI secrets**
3. **Release emergency update with new key**
4. **Revoke old releases if possible**
5. **Audit recent releases for tampering**

#### CI/CD Failure

If CI build fails:

1. **Check GitHub secrets are set correctly**
2. **Verify private key format and password**
3. **Test key generation locally**
4. **Check workflow permissions**
5. **Review build logs for specific errors**

---

## Additional Resources

-   [Tauri Updater Documentation](https://tauri.app/v1/guides/distribution/updater)
-   [Minisign Documentation](https://jedisct1.github.io/minisign/)
-   [GitHub Actions Workflows](../.github/workflows/)
-   [Building Documentation](./building.md)

---

**Last Updated**: January 2025  
**Maintainer**: Whisperer Development Team
