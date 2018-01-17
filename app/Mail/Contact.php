<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Auth;

class Contact extends Mailable
{
    use Queueable, SerializesModels;

    private $emailContent;
    private $emailSubject;

    /**
     * Create a new message instance.
     *
     * @return void
     */
    public function __construct($content, $subject)
    {
        $this->emailContent = $content;
        $this->emailSubject = $subject;
    }

    /**
     * Build the message.
     *
     * @return $this
     */
    public function build()
    {
        $user = Auth::user();

        return $this->from($user->email, $user->name)
            ->view('emails.contact.default')
            ->subject($this->emailSubject)
            ->with([
                'content' => nl2br($this->emailContent),
            ]);
    }
}
