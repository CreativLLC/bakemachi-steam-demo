Add-Type -AssemblyName System.Drawing
Get-ChildItem "D:\Google Drive\1 Projects\Japanese Learning RPG\bakemachi\public\assets\tilesets\walls-interior\*.png" | ForEach-Object {
    $img = [System.Drawing.Image]::FromFile($_.FullName)
    Write-Output "$($_.Name): $($img.Width)x$($img.Height)"
    $img.Dispose()
}
