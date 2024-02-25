(let ((main-file (expand-file-name "org/clock.org" tmp-dir)))
  (find-file main-file)
  (org-mode)
  (goto-char (point-min))
  (search-forward "Sample clocked item")
  (beginning-of-line)
  (org-clock-in)
  (sleep-for 5)
  (org-clock-out))
