;;; org-newtab.el --- WIP -*-lexical-binding:t-*-

;; Copyright (C) 2023, Zweihänder <zweidev@zweihander.me>
;;
;; Author: Zweihänder
;; Keywords: outlines
;; Homepage: https://github.com/Zweihander-Main/org-newtab
;; Version: 0.0.1
;; Package-Requires: ((emacs "25.1") (websocket "1.7") (async "1.9.4"))

;; This file is not part of GNU Emacs.

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
;;
;; WIP
;;
;;; Code:

(require 'cl-lib)

(defgroup org-newtab nil
  "A browser new tab page linked to `org-agenda'."
  :group 'org-newtab
  :prefix "org-newtab-"
  :link `(url-link :tag "Github" "https://github.com/Zweihander-Main/org-newtab"))

(defcustom org-newtab-ws-port
  35942
  "Port to server websocket server on."
  :type 'integer
  :group 'org-newtab)

(provide 'org-newtab)

(cl-eval-when (load eval)
  (require 'org-newtab-server)
  (require 'org-newtab-agenda))

;; Local Variables:
;; coding: utf-8
;; End:

;;; org-newtab.el ends here