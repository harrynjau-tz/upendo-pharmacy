import Link from "next/link";
import Navbar from "@/components/Navbar";
import HeroSlider from "@/components/HeroSlider";
import { ShieldCheck, Truck, Clock, Star } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero Slideshow */}
      <HeroSlider />

      {/* Features */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
            Kwa Nini Upendo Pharmacy?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: <ShieldCheck className="text-blue-600" size={40} />,
                title: "Dawa Halisi",
                desc: "Dawa zote zimethibitishwa na wataalam wa afya",
              },
              {
                icon: <Truck className="text-blue-600" size={40} />,
                title: "Uwasilishaji Haraka",
                desc: "Tunawasilisha dawa hadi mlangoni mwako",
              },
              {
                icon: <Clock className="text-blue-600" size={40} />,
                title: "Huduma 24/7",
                desc: "Tuko hapa wakati wote unapohitaji msaada",
              },
              {
                icon: <Star className="text-blue-600" size={40} />,
                title: "Bei Nafuu",
                desc: "Dawa bora kwa bei zinazofaa mkoba wako",
              },
            ].map((f, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-6 shadow hover:shadow-md transition text-center"
              >
                <div className="flex justify-center mb-3">{f.icon}</div>
                <h3 className="font-bold text-lg text-gray-800 mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-blue-50 py-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            Anza Kununua Leo
          </h2>
          <p className="text-gray-500 mb-8">
            Tengeneza akaunti yako bure na uanze kupata dawa kwa urahisi
          </p>
          <Link
            href="/medicines"
            className="bg-blue-600 text-white px-10 py-3 rounded-full text-lg font-semibold hover:bg-blue-700 transition shadow"
          >
            Angalia Dawa Zetu
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-blue-800 text-white py-8 px-4 text-center">
        <p className="text-blue-200">
          &copy; {new Date().getFullYear()} Upendo Pharmacy. Haki zote zimehifadhiwa.
        </p>
        <p className="text-blue-300 text-sm mt-1">Afya yako ni kipaumbele chetu</p>
      </footer>
    </div>
  );
}
