"use client";

import { Button } from "@/components/ui/Button";
import { FiArrowRight } from "react-icons/fi";
import Link from "next/link";

export default function CTASection() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50 border-t border-slate-200">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-4xl font-bold text-slate-900 mb-6">
          Ready to Start?
        </h2>
        <p className="text-xl text-slate-600 mb-10">
          Explore the platform or create an account to start automating customer care today.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/dashboard">
            <Button
              size="lg"
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-8 h-12 font-semibold"
            >
              Get Started
              <FiArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
          <Button
            size="lg"
            variant="outline"
            className="border-slate-300 text-slate-700 hover:bg-slate-50 rounded-full px-8 h-12 font-semibold"
          >
            Contact Sales
          </Button>
        </div>
      </div>
    </section>
  );
}
