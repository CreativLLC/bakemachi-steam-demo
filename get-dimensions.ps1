Add-Type -AssemblyName System.Drawing
$base = "D:\Google Drive\1 Projects\Japanese Learning RPG\bakemachi\public\assets"
Get-ChildItem -Recurse $base -Filter "*.png" | ForEach-Object {
    try {
        $img = [System.Drawing.Image]::FromFile($_.FullName)
        $rel = $_.FullName.Replace($base + "\", "")
        Write-Host "$rel : $($img.Width)x$($img.Height)"
        $img.Dispose()
    } catch {
        Write-Host "$($_.Name) : ERROR"
    }
}
