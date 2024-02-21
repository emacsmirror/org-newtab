;;; org-newtab-mode.el --- Toggle WebSocket server and hooks -*-lexical-binding:t-*-

;; Copyright (C) 2023-2024, Zweihänder <zweidev@zweihander.me>
;;
;; Author: Zweihänder <zweidev@zweihander.me>

;; This file is not part of GNU Emacs.

;; SPDX-License-Identifier: AGPL-3.0-or-later

;;; License:

;; This program is free software: you can redistribute it and/or modify
;; it under the terms of the GNU Affero General Public License as published
;; by the Free Software Foundation, either version 3 of the License, or
;; (at your option) any later version.
;;
;; This program is distributed in the hope that it will be useful,
;; but WITHOUT ANY WARRANTY; without even the implied warranty of
;; MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
;; GNU Affero General Public License for more details.
;;
;; You should have received a copy of the GNU Affero General Public License
;; along with this program.  If not, see <https://www.gnu.org/licenses/>.

;;; Commentary:

;; This file provides a minor mode to toggle the WebSocket server and org hooks.
;; Hook related code primarily goes here.

;;; Code:

(eval-when-compile
  (cl-pushnew (expand-file-name default-directory) load-path))

(require 'org-newtab-server)
(require 'org-newtab-store)

(defun org-newtab--get-item (&optional payload)
  "Send an item to the extension based on :query and :resid in PAYLOAD.
If QUERY is nil, use `org-newtab--last-match-query'. If RESID is nil, ignore."
  (let ((query (or (plist-get payload :query)
                   (org-newtab--selected-last-match-query)))
        (resid (plist-get payload :resid)))
    (cond ((org-clocking-p)
           (org-newtab--on-msg-send-clocked-in resid))
          (t
           (org-newtab--on-msg-send-match-query query resid)))))

(defun org-newtab--save-all-agenda-buffers ()
  "Save all Org agenda buffers without user confirmation.
Necessary to allow for async queries to use fresh data."
  (save-some-buffers t (lambda () (org-agenda-file-p))))

(defun org-newtab--save-and-get-item (&rest _)
  "Send new item to client using last recorded match query."
  (org-newtab--save-all-agenda-buffers)
  (org-newtab--get-item))

(defun org-newtab--on-state-change (&optional change-data)
  "From `org-trigger-hook', send new query if CHANGE-DATA changed."
  (when change-data
    (let ((to (substring-no-properties (plist-get change-data :to)))
          (from (substring-no-properties (plist-get change-data :from))))
      (unless (string-match-p from to)
        (org-newtab--save-and-get-item)))))

;; TODO: ping the client on async to let it know data is coming
;; TODO: Let client know async function is running (send resid)
;; TODO: on clock out, let client know clock out occured if async needed

(defconst org-newtab--hook-assocs
  '((org-clock-in-hook . org-newtab--on-msg-send-clocked-in)
    (org-clock-out-hook . org-newtab--save-and-get-item)
    (org-clock-cancel-hook . org-newtab--save-and-get-item)
    (org-trigger-hook . org-newtab--on-state-change)
    (org-after-tags-change-hook . org-newtab--save-and-get-item)
    (org-after-refile-insert-hook . org-newtab--save-and-get-item))
  "Association list of hooks and functions to append to them.")

;; TODO: can determine if the client todo is the headline being edited
;; - Note that using the match query method, it should never change the item
;; sent as you can't match on headline
(defconst org-newtab--advice-assocs
  '((org-edit-headline . org-newtab--save-and-get-item)
    (org-priority . org-newtab--save-and-get-item)
    (org-set-effort . org-newtab--save-and-get-item))
  "Association list of functions and advice to append to them.")

;;;###autoload
(define-minor-mode
  org-newtab-mode
  "Enable `org-newtab'.
Start the websocket server and add hooks in."
  :lighter " org-newtab"
  :global t
  :group 'org-newtab
  :init-value nil
  (cond
   (org-newtab-mode
    (org-newtab--start-server)
    (org-newtab--subscribe 'ext-get-item #'org-newtab--get-item)
    (dolist (assoc org-newtab--hook-assocs)
      (add-hook (car assoc) (cdr assoc)))
    (dolist (assoc org-newtab--advice-assocs)
      (advice-add (car assoc) :after (cdr assoc))))
   (t
    (org-newtab--close-server)
    (org-newtab--clear-subscribers)
    (dolist (assoc org-newtab--hook-assocs)
      (remove-hook (car assoc) (cdr assoc)))
    (dolist (assoc org-newtab--advice-assocs)
      (advice-remove (car assoc) (cdr assoc))))))

(provide 'org-newtab-mode)

;; Local Variables:
;; coding: utf-8
;; End:

;;; org-newtab-mode.el ends here
