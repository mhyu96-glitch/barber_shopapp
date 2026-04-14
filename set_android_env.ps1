# Set Android Environment Variables
echo "Setting ANDROID_HOME to D:\android-sdk..."
[Environment]::SetEnvironmentVariable("ANDROID_HOME", "D:\android-sdk", "User")
[Environment]::SetEnvironmentVariable("ANDROID_SDK_ROOT", "D:\android-sdk", "User")

$currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
$newPaths = @("D:\android-sdk\emulator", "D:\android-sdk\platform-tools", "D:\android-sdk\cmdline-tools\latest\bin")

foreach ($p in $newPaths) {
    if ($currentPath -notlike "*$p*") {
        echo "Adding $p to Path..."
        $currentPath = "$p;$currentPath"
    }
}

[Environment]::SetEnvironmentVariable("Path", $currentPath, "User")
echo "Environment variables set! Please restart VS Code for changes to take effect."
