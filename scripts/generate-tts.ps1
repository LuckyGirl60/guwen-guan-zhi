param(
  [Parameter(Mandatory = $true)][string]$ArticlePath,
  [Parameter(Mandatory = $true)][string]$OutputDir
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Speech

$article = Get-Content -Raw -Encoding UTF8 $ArticlePath | ConvertFrom-Json
$output = [System.IO.Path]::GetFullPath($OutputDir)
New-Item -ItemType Directory -Force -Path $output | Out-Null

$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$voice = $synth.GetInstalledVoices() | Where-Object { $_.VoiceInfo.Culture.Name -like 'zh-*' } | Select-Object -First 1
if ($null -eq $voice) {
  throw 'No Chinese speech voice installed. Use --skip-audio or install a zh-CN voice.'
}
$synth.SelectVoice($voice.VoiceInfo.Name)
$synth.Rate = -1
$synth.Volume = 92

$files = @()
for ($index = 0; $index -lt $article.sentences.Count; $index++) {
  $sentence = $article.sentences[$index]
  $name = 'sentence-{0:D3}.wav' -f ($index + 1)
  $path = Join-Path $output $name
  $synth.SetOutputToWaveFile($path)
  $synth.Speak([string]$sentence.text)
  $synth.SetOutputToNull()
  $files += [ordered]@{ sentenceId = $sentence.id; path = $name; status = 'synthetic_tts' }
}
$synth.Dispose()

[ordered]@{
  provider = 'Windows System.Speech'
  voice = $voice.VoiceInfo.Name
  status = 'prototype_only'
  files = $files
} | ConvertTo-Json -Depth 5 | Set-Content -Encoding UTF8 (Join-Path $output 'tts-info.json')
