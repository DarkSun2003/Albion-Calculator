Set WshShell = CreateObject("WScript.Shell")
Set FSO = CreateObject("Scripting.FileSystemObject")

RootDir = FSO.GetParentFolderName(WScript.ScriptFullName)
VenvPythonW = RootDir & "\.venv\Scripts\pythonw.exe"
VenvPython = RootDir & "\.venv\Scripts\python.exe"
DesktopScript = Chr(34) & RootDir & "\desktop_app.py" & Chr(34)

If FSO.FileExists(VenvPythonW) Then
    Cmd = Chr(34) & VenvPythonW & Chr(34) & " " & DesktopScript
ElseIf FSO.FileExists(VenvPython) Then
    Cmd = Chr(34) & VenvPython & Chr(34) & " " & DesktopScript
Else
    Cmd = "pythonw " & DesktopScript
End If

' Launch completely silently (0 = hidden console) so only the standalone Desktop App window opens
WshShell.Run Cmd, 0, False
